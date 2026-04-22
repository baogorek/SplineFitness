"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { ArrowLeft, Calendar, Volume2, Zap, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { RoundTimer } from "@/components/circuit/round-timer"
import { SitPhaseDisplay } from "./sit-phase-display"
import { SprintReady, SprintActive, SprintRecovery } from "./sit-sprint-cycle"
import { PerformanceDropModal } from "./performance-drop-modal"
import {
  clearSitProgress,
  getSitProgress,
  saveSitProgress,
  saveWorkoutSession,
} from "@/lib/storage"
import { SprintRecord, SitSessionProgress, SitWorkoutSession } from "@/types/workout"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"
import {
  SitPhase,
  GENERAL_WARMUP_SECONDS,
  TISSUE_PREP_SETS,
  TISSUE_PREP_WORK_SECONDS,
  TISSUE_PREP_REST_SECONDS,
  NEURAL_HOLD_SECONDS,
  NEURAL_SWITCH_SECONDS,
  WASHOUT_SECONDS,
  computeSprintRecovery,
  PHASE_LABELS,
  PHASE_SPEECH_CUES,
  PHASE_COACHING_CUES,
  NEXT_UP_CUES,
  getNextPhaseLabel,
} from "@/data/sit-cues"

interface SitWorkoutProps {
  onModeChange: () => void
}

const KEEPALIVE_PHASES: SitPhase[] = [
  "general-warmup",
  "tissue-prep-work",
  "tissue-prep-rest",
  "neural-left",
  "neural-switch",
  "neural-right",
  "washout",
  "sprint-ready",
  "sprint-active",
  "sprint-recovery",
]

const TIMED_PHASES: SitPhase[] = [
  "general-warmup",
  "tissue-prep-work",
  "tissue-prep-rest",
  "neural-left",
  "neural-switch",
  "neural-right",
  "washout",
  "sprint-recovery",
]

const SPRINT_ORIENTATION_PHASES: SitPhase[] = ["sprint-ready", "sprint-active", "sprint-recovery"]

function getResumeCheckpointLabel(progress: SitSessionProgress): string {
  switch (progress.phase) {
    case "warmup-countdown":
      return "Warmup countdown"
    case "tissue-prep-work":
    case "tissue-prep-rest":
      return `${PHASE_LABELS[progress.phase]} (Set ${progress.tissuePrepSet}/${TISSUE_PREP_SETS})`
    case "sprint-ready":
      return `Sprint ${progress.sprintNumber} ready`
    case "sprint-recovery":
      return "Sprint recovery"
    default:
      return PHASE_LABELS[progress.phase] || "In progress"
  }
}

export function SitWorkout({ onModeChange }: SitWorkoutProps) {
  const [phase, setPhase] = useState<SitPhase>("ready")
  const [tissuePrepSet, setTissuePrepSet] = useState(1)
  const [sprintNumber, setSprintNumber] = useState(1)
  const [sprintHistory, setSprintHistory] = useState<SprintRecord[]>([])
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [showDropModal, setShowDropModal] = useState(false)
  const [pendingShortMA, setPendingShortMA] = useState<number | null>(null)
  const [pendingLongMA, setPendingLongMA] = useState<number | null>(null)
  const [testMode, setTestMode] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState<SitWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [warmupCountdown, setWarmupCountdown] = useState(5)
  const [sprintCountdownValue, setSprintCountdownValue] = useState<number | null>(null)
  const [pendingResume, setPendingResume] = useState<SitSessionProgress | null>(null)

  const audio = useAudio()
  const { signInWithGoogle } = useAuth()
  const workoutStartedRef = useRef(false)
  const startedAtRef = useRef<string>("")
  const sprintStartRef = useRef<number>(0)
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const firedCuesRef = useRef<Set<string>>(new Set())
  const phasesCompletedRef = useRef(0)
  const lastTickRemainingRef = useRef<number>(-1)
  const restoreTimedPhaseRef = useRef<{ phase: SitPhase; elapsedSeconds: number } | null>(null)

  const speedMultiplier = testMode ? 12 : 1

  useWakeLock(phase !== "ready" && phase !== "complete")
  useNavigationGuard(phase !== "ready" && phase !== "complete")

  useEffect(() => {
    const saved = getSitProgress()
    if (saved) {
      setPendingResume(saved)
    }
  }, [])

  useEffect(() => {
    if (KEEPALIVE_PHASES.includes(phase)) {
      audio.startKeepalive()
    } else {
      audio.stopKeepalive()
    }
    return () => { audio.stopKeepalive() }
  }, [phase, audio])

  useEffect(() => {
    if (SPRINT_ORIENTATION_PHASES.includes(phase)) {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>
        }
        orientation.lock?.("portrait").catch(() => {})
      } catch {}
    }
    return () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          unlock?: () => void
        }
        orientation.unlock?.()
      } catch {}
    }
  }, [phase])

  const workoutTimer = useTimer({ countUp: true, speedMultiplier })

  const lastSprintTime = useMemo(() => {
    if (sprintHistory.length === 0) return 0
    return sprintHistory[sprintHistory.length - 1].timeSeconds
  }, [sprintHistory])

  const phaseTargetSeconds = useMemo(() => {
    switch (phase) {
      case "general-warmup": return GENERAL_WARMUP_SECONDS
      case "tissue-prep-work": return TISSUE_PREP_WORK_SECONDS
      case "tissue-prep-rest": return TISSUE_PREP_REST_SECONDS
      case "neural-left":
      case "neural-right": return NEURAL_HOLD_SECONDS
      case "neural-switch": return NEURAL_SWITCH_SECONDS
      case "washout": return WASHOUT_SECONDS
      case "sprint-recovery": return lastSprintTime > 0 ? computeSprintRecovery(lastSprintTime) : 180
      default: return 0
    }
  }, [phase, lastSprintTime])

  const phaseTimer = useTimer({
    targetSeconds: phaseTargetSeconds || undefined,
    onTick: (remaining) => {
      const cues = PHASE_COACHING_CUES[phase]
      if (cues) {
        for (const cue of cues) {
          const key = `${phase}-${cue.remainingSeconds}`
          if (remaining === cue.remainingSeconds && !firedCuesRef.current.has(key)) {
            firedCuesRef.current.add(key)
            audio.speak(cue.text)
          }
        }
      }
      if (phase === "tissue-prep-rest" && remaining === 10) {
        const cueKey = tissuePrepSet < TISSUE_PREP_SETS
          ? "tissue-prep-rest->tissue-prep-work"
          : "tissue-prep-rest->neural-left"
        const key = `next-up-${cueKey}`
        if (!firedCuesRef.current.has(key) && NEXT_UP_CUES[cueKey]) {
          firedCuesRef.current.add(key)
          audio.speak(NEXT_UP_CUES[cueKey])
        }
      }
      if (remaining >= 1 && remaining <= 5 && remaining !== lastTickRemainingRef.current) {
        lastTickRemainingRef.current = remaining
        audio.playCountdownTick()
      }
    },
    onComplete: () => {
      handlePhaseComplete()
    },
    speedMultiplier,
  })

  const clearCountdownTimeouts = useCallback(() => {
    countdownTimeoutsRef.current.forEach(clearTimeout)
    countdownTimeoutsRef.current = []
  }, [])

  useEffect(() => clearCountdownTimeouts, [clearCountdownTimeouts])

  const transitionTo = useCallback((nextPhase: SitPhase) => {
    phaseTimer.pause()
    phaseTimer.reset()
    firedCuesRef.current.clear()
    lastTickRemainingRef.current = -1
    setPhase(nextPhase)
  }, [phaseTimer])

  useEffect(() => {
    if (!TIMED_PHASES.includes(phase)) return

    const restoredPhase = restoreTimedPhaseRef.current
    if (restoredPhase?.phase === phase) {
      restoreTimedPhaseRef.current = null
      phaseTimer.resetTo(restoredPhase.elapsedSeconds)
      phaseTimer.start()
      const speechCue = PHASE_SPEECH_CUES[phase]
      if (speechCue) {
        audio.speak(`Resuming. ${speechCue}`)
      }
      return
    }

    phaseTimer.reset()
    phaseTimer.start()
    const speechCue = PHASE_SPEECH_CUES[phase]
    if (speechCue) {
      audio.speak(speechCue)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const saveProgressSnapshot = useCallback(() => {
    if (!workoutStartedRef.current || phase === "ready" || phase === "complete" || pendingResume) {
      return
    }

    const checkpointPhase = phase === "sprint-active" ? "sprint-ready" : phase
    saveSitProgress({
      phase: checkpointPhase,
      tissuePrepSet,
      sprintNumber,
      sprintHistory,
      bestTime,
      warmupCountdown,
      workoutTimerSeconds: workoutTimer.elapsedSeconds,
      phaseTimerElapsedSeconds: TIMED_PHASES.includes(phase) ? phaseTimer.elapsedSeconds : 0,
      phasesCompleted: phasesCompletedRef.current,
      startedAt: startedAtRef.current,
      savedAt: new Date().toISOString(),
    })
  }, [
    phase,
    tissuePrepSet,
    sprintNumber,
    sprintHistory,
    bestTime,
    warmupCountdown,
    workoutTimer.elapsedSeconds,
    phaseTimer.elapsedSeconds,
    pendingResume,
  ])

  useEffect(() => {
    saveProgressSnapshot()
  }, [saveProgressSnapshot])

  useEffect(() => {
    const handlePageHide = () => {
      saveProgressSnapshot()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveProgressSnapshot()
      }
    }

    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [saveProgressSnapshot])

  const handlePhaseComplete = useCallback(() => {
    switch (phase) {
      case "general-warmup":
        transitionTo("tissue-prep-work")
        break
      case "tissue-prep-work":
        transitionTo("tissue-prep-rest")
        break
      case "tissue-prep-rest":
        if (tissuePrepSet < TISSUE_PREP_SETS) {
          setTissuePrepSet((s) => s + 1)
          transitionTo("tissue-prep-work")
        } else {
          phasesCompletedRef.current = 1
          transitionTo("neural-left")
        }
        break
      case "neural-left":
        transitionTo("neural-switch")
        break
      case "neural-switch":
        transitionTo("neural-right")
        break
      case "neural-right":
        phasesCompletedRef.current = 2
        transitionTo("washout")
        break
      case "washout":
        phasesCompletedRef.current = 3
        transitionTo("sprint-ready")
        break
      case "sprint-recovery":
        transitionTo("sprint-ready")
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tissuePrepSet])

  const startWarmupCountdown = useCallback((startFrom = 5, announce = true) => {
    clearCountdownTimeouts()
    setPhase("warmup-countdown")
    setWarmupCountdown(startFrom)
    const tick = 1000 / speedMultiplier

    if (announce) {
      audio.speak("Get ready for jumping jacks")
    }

    const timeouts: NodeJS.Timeout[] = []
    for (let nextCount = startFrom - 1, step = 1; nextCount >= 1; nextCount -= 1, step += 1) {
      timeouts.push(setTimeout(() => {
        audio.playCountdownTick()
        setWarmupCountdown(nextCount)
      }, tick * step))
    }
    timeouts.push(setTimeout(() => {
      audio.playCountdownGo()
      workoutTimer.start()
      transitionTo("general-warmup")
    }, tick * startFrom))

    countdownTimeoutsRef.current = timeouts
  }, [workoutTimer, transitionTo, audio, speedMultiplier, clearCountdownTimeouts])

  const handleStartWorkout = useCallback(() => {
    workoutStartedRef.current = true
    startedAtRef.current = new Date().toISOString()
    phasesCompletedRef.current = 0
    startWarmupCountdown()
  }, [startWarmupCountdown])

  const handleSkipWarmup = useCallback(() => {
    workoutStartedRef.current = true
    startedAtRef.current = new Date().toISOString()
    phasesCompletedRef.current = 3
    clearCountdownTimeouts()
    phaseTimer.pause()
    phaseTimer.reset()
    setWarmupCountdown(5)
    setSprintCountdownValue(null)
    workoutTimer.reset()
    workoutTimer.start()
    setPhase("sprint-ready")
  }, [clearCountdownTimeouts, phaseTimer, workoutTimer])

  const handleResume = useCallback(() => {
    if (!pendingResume) return

    workoutStartedRef.current = true
    startedAtRef.current = pendingResume.startedAt
    phasesCompletedRef.current = pendingResume.phasesCompleted

    setTissuePrepSet(pendingResume.tissuePrepSet)
    setSprintNumber(pendingResume.sprintNumber)
    setSprintHistory(pendingResume.sprintHistory)
    setBestTime(pendingResume.bestTime)
    setWarmupCountdown(pendingResume.warmupCountdown)
    setSprintCountdownValue(null)
    setShowDropModal(false)
    setPendingShortMA(null)
    setPendingLongMA(null)
    workoutTimer.resetTo(pendingResume.workoutTimerSeconds)
    setPendingResume(null)

    if (pendingResume.phase === "warmup-countdown") {
      startWarmupCountdown(pendingResume.warmupCountdown, true)
      return
    }

    if (TIMED_PHASES.includes(pendingResume.phase)) {
      restoreTimedPhaseRef.current = {
        phase: pendingResume.phase,
        elapsedSeconds: pendingResume.phaseTimerElapsedSeconds,
      }
      workoutTimer.start()
      setPhase(pendingResume.phase)
      return
    }

    workoutTimer.start()
    setPhase(pendingResume.phase)
  }, [pendingResume, startWarmupCountdown, workoutTimer])

  const handleDiscardResume = useCallback(() => {
    clearSitProgress()
    setPendingResume(null)
    setPhase("ready")
  }, [])

  const startSprintCountdown = useCallback(() => {
    clearCountdownTimeouts()
    const tick = 1000 / speedMultiplier

    audio.speak(`Sprint ${sprintNumber}`)
    setSprintCountdownValue(3)

    const timeouts = [
      setTimeout(() => { audio.playCountdownTick(); setSprintCountdownValue(3) }, tick * 1),
      setTimeout(() => { audio.playCountdownTick(); setSprintCountdownValue(2) }, tick * 2),
      setTimeout(() => { audio.playCountdownTick(); setSprintCountdownValue(1) }, tick * 3),
      setTimeout(() => {
        audio.playCountdownGo()
        setSprintCountdownValue(null)
        sprintStartRef.current = performance.now()
        setPhase("sprint-active")
      }, tick * 4),
    ]
    countdownTimeoutsRef.current = timeouts
  }, [sprintNumber, audio, speedMultiplier, clearCountdownTimeouts])

  const handleSprintStop = useCallback(() => {
    const elapsed = (performance.now() - sprintStartRef.current) / 1000
    const record: SprintRecord = { sprintNumber, timeSeconds: elapsed }

    const updatedHistory = [...sprintHistory, record]
    setSprintHistory(updatedHistory)
    const newBest = bestTime === null ? elapsed : Math.min(bestTime, elapsed)
    setBestTime(newBest)

    if (updatedHistory.length >= 3) {
      const times = updatedHistory.map((s) => s.timeSeconds)
      const longMA = times.reduce((a, b) => a + b, 0) / times.length
      const shortMA = (times[times.length - 1] + times[times.length - 2]) / 2
      const drop = (shortMA - longMA) / longMA
      if (drop > 0.05) {
        setPendingShortMA(shortMA)
        setPendingLongMA(longMA)
        setShowDropModal(true)
        phaseTimer.pause()
        phaseTimer.reset()
        setPhase("sprint-recovery")
        setSprintNumber((n) => n + 1)
        return
      }
    }

    setSprintNumber((n) => n + 1)
    phaseTimer.reset()
    transitionTo("sprint-recovery")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintNumber, bestTime, sprintHistory.length, phaseTimer, transitionTo])

  const saveAndComplete = useCallback(async (endedEarly: boolean) => {
    workoutTimer.pause()
    phaseTimer.pause()
    clearCountdownTimeouts()
    clearSitProgress()
    phasesCompletedRef.current = endedEarly ? phasesCompletedRef.current : 4

    const session: SitWorkoutSession = {
      mode: "sit",
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
      totalTimeSeconds: workoutTimer.elapsedSeconds,
      sprintTimes: sprintHistory,
      bestSprintTimeSeconds: bestTime,
      phasesCompleted: phasesCompletedRef.current,
      endedEarly,
    }

    setCompletedSessionData(session)
    if (FEATURES.AUTH_ENABLED) {
      const result = await saveWorkoutSession(session)
      setSavedToHistory(result !== null)
    }
    setPhase("complete")
  }, [workoutTimer, phaseTimer, sprintHistory, bestTime, clearCountdownTimeouts])

  const handleEndWorkout = useCallback(() => {
    saveAndComplete(sprintHistory.length === 0)
  }, [saveAndComplete, sprintHistory.length])

  const handleDropContinue = useCallback(() => {
    setShowDropModal(false)
    setPendingShortMA(null)
    setPendingLongMA(null)
  }, [])

  const handleDropEnd = useCallback(() => {
    setShowDropModal(false)
    setPendingShortMA(null)
    setPendingLongMA(null)
    saveAndComplete(true)
  }, [saveAndComplete])

  const handleSkipWashout = useCallback(() => {
    handlePhaseComplete()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tissuePrepSet])

  const handleSkipRecovery = useCallback(() => {
    transitionTo("sprint-ready")
  }, [transitionTo])

  const handleDiscardLastSprint = useCallback(() => {
    if (sprintHistory.length === 0) return
    const updated = sprintHistory.slice(0, -1)
    setSprintHistory(updated)
    const newBest = updated.length > 0
      ? Math.min(...updated.map((s) => s.timeSeconds))
      : null
    setBestTime(newBest)
    setSprintNumber((n) => n - 1)
    if (updated.length === 0) {
      transitionTo("sprint-ready")
    }
  }, [sprintHistory, transitionTo])

  const handleEditSprint = useCallback((sprintNum: number, newTime: number) => {
    const updated = sprintHistory.map((s) =>
      s.sprintNumber === sprintNum ? { ...s, timeSeconds: newTime } : s
    )
    setSprintHistory(updated)
    const newBest = Math.min(...updated.map((s) => s.timeSeconds))
    setBestTime(newBest)
  }, [sprintHistory])

  const handleTestAudio = () => {
    audio.speak("Phosphocreatine resynthesis active.")
  }

  const buildGoogleCalendarUrl = (session: SitWorkoutSession): string => {
    const toCalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+Z/, "Z")
    const mins = Math.floor(session.totalTimeSeconds / 60)
    const secs = (session.totalTimeSeconds % 60).toString().padStart(2, "0")

    const lines = [
      `Sprints: ${session.sprintTimes.length}`,
      `Best Sprint: ${session.bestSprintTimeSeconds !== null ? `${session.bestSprintTimeSeconds.toFixed(1)}s` : "—"}`,
    ]
    session.sprintTimes.forEach((s) => {
      lines.push(`  Sprint ${s.sprintNumber}: ${s.timeSeconds.toFixed(1)}s`)
    })
    lines.push(`Total Time: ${mins}:${secs}`, "", "Session Data:", JSON.stringify(session))

    let details = lines.join("\n")
    if (details.length > 1500) {
      details = details.slice(0, 1497) + "..."
    }

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "SIT Sprint Training",
      dates: `${toCalDate(session.startedAt)}/${toCalDate(session.completedAt || session.startedAt)}`,
      details,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  if (pendingResume) {
    const savedTime = new Date(pendingResume.savedAt)
    const timeAgo = Math.round((Date.now() - savedTime.getTime()) / 60000)
    const timeAgoText = timeAgo < 1 ? "just now" : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`
    const completedSprints = pendingResume.sprintHistory.length

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume SIT Session?</h1>
          <p className="text-muted-foreground">
            You have an in-progress sprint session from {timeAgoText}.
          </p>
          <div className="rounded-lg bg-muted/50 p-4 text-left space-y-1">
            <p className="text-sm text-foreground">
              Checkpoint: {getResumeCheckpointLabel(pendingResume)}
            </p>
            <p className="text-sm text-muted-foreground">
              {completedSprints} sprint{completedSprints !== 1 ? "s" : ""} completed
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleResume}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors w-full"
            >
              Resume
            </button>
            <button
              onClick={handleDiscardResume}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors w-full"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Complete screen
  if (phase === "complete") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">SIT Sprint Complete!</h1>
          <p className="text-muted-foreground">
            You completed {sprintHistory.length} sprint{sprintHistory.length !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Time
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {workoutTimer.formattedTime}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Best Sprint
              </p>
              <p className="text-2xl font-mono font-bold text-green-600">
                {bestTime !== null ? `${bestTime.toFixed(1)}s` : "—"}
              </p>
            </div>
          </div>

          {sprintHistory.length > 0 && (
            <div className="space-y-2 mt-4">
              {sprintHistory.map((s) => (
                <div
                  key={s.sprintNumber}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">Sprint {s.sprintNumber}</span>
                  <span className={`text-sm font-mono font-bold ${
                    bestTime !== null && s.timeSeconds === bestTime ? "text-green-600" : "text-foreground"
                  }`}>
                    {s.timeSeconds.toFixed(1)}s
                  </span>
                </div>
              ))}
            </div>
          )}

          {completedSessionData && (
            <>
              <a
                href={buildGoogleCalendarUrl(completedSessionData)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors w-full mt-2"
              >
                <Calendar className="h-4 w-4" />
                Add to Google Calendar
              </a>
              <p className="text-center text-sm font-semibold text-amber-500 mt-1">
                Remember to tap Save in Google Calendar!
              </p>
            </>
          )}

          {FEATURES.AUTH_ENABLED && (
            savedToHistory ? (
              <div className="rounded-lg bg-green-600/10 border border-green-600/20 p-3 mt-4">
                <p className="text-sm text-green-600 font-medium">Saved to workout history</p>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-600/10 border border-amber-600/20 p-4 mt-4">
                <p className="text-sm text-amber-600 font-medium">
                  Sign in to save your workouts and track progress over time
                </p>
                <Button variant="outline" size="sm" onClick={signInWithGoogle} className="mt-3">
                  Sign in with Google
                </Button>
              </div>
            )
          )}

          <button
            onClick={onModeChange}
            className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // Sprint active: full-screen layout
  if (phase === "sprint-active") {
    return (
      <div className="min-h-screen flex flex-col">
        <SprintActive onStop={handleSprintStop} />
        {showDropModal && pendingShortMA !== null && pendingLongMA !== null && (
          <PerformanceDropModal
            shortMA={pendingShortMA}
            longMA={pendingLongMA}
            onContinue={handleDropContinue}
            onEndWorkout={handleDropEnd}
          />
        )}
      </div>
    )
  }

  const isTimedPhase = [
    "general-warmup", "tissue-prep-work", "tissue-prep-rest",
    "neural-left", "neural-switch", "neural-right",
    "washout",
  ].includes(phase)

  return (
    <div className="min-h-screen flex flex-col pb-4">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onModeChange} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="text-sm font-semibold tracking-tight text-foreground">SIT SPRINT</span>
              <button
                onClick={() => setTestMode(!testMode)}
                className={`flex h-6 px-2 items-center gap-1 rounded text-xs font-medium transition-colors ${
                  testMode
                    ? "bg-yellow-500 text-yellow-950"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="h-3 w-3" />
                {testMode ? "12x" : "Test"}
              </button>
              <button
                onClick={handleTestAudio}
                className="flex h-6 px-2 items-center gap-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Volume2 className="h-3 w-3" />
                Audio
              </button>
            </div>
            {phase === "sprint-ready" || phase === "sprint-recovery" ? (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Sprint {sprintNumber}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-background">
          {workoutStartedRef.current && (
            <RoundTimer
              formattedTime={workoutTimer.formattedTime}
              isRunning={workoutTimer.isRunning}
              round={1}
              label="Workout"
            />
          )}

          {phase === "ready" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center">
                <Zap className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">SIT Sprint</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Sprint Interval Training: tissue prep, neural potentiation, washout, then all-out sprints with full ATP recovery
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleStartWorkout}
                className="h-14 px-8 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white"
              >
                Start Workout
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleSkipWarmup}
                className="h-12 px-8 text-base font-semibold"
              >
                Already Warmed Up
              </Button>
              <p className="text-xs text-muted-foreground text-center max-w-xs -mt-2">
                Skip the guided warmup and go straight to sprint setup.
              </p>
            </div>
          )}

          {phase === "warmup-countdown" && (
            <div className="flex flex-col items-center gap-6 py-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                Get Ready
              </p>
              <span className="text-8xl font-mono font-bold text-foreground tabular-nums">
                {warmupCountdown}
              </span>
              <p className="text-lg text-muted-foreground">Jumping Jacks</p>
            </div>
          )}

          {isTimedPhase && (
            <SitPhaseDisplay
              phase={phase}
              formattedTime={phaseTimer.formattedTime}
              elapsedSeconds={phaseTimer.elapsedSeconds}
              targetSeconds={phaseTargetSeconds}
              isRunning={phaseTimer.isRunning}
              tissuePrepSet={tissuePrepSet}
              nextUpLabel={getNextPhaseLabel(phase as SitPhase, tissuePrepSet) ?? undefined}
              onPause={() => { phaseTimer.pause(); workoutTimer.pause() }}
              onResume={() => { phaseTimer.start(); workoutTimer.start() }}
              onSkip={phase === "washout" ? handleSkipWashout : undefined}
            />
          )}

          {phase === "sprint-ready" && sprintCountdownValue !== null && (
            <div className="flex flex-col items-center gap-6 py-12">
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                Sprint {sprintNumber}
              </p>
              <span className="text-8xl font-mono font-bold text-foreground tabular-nums">
                {sprintCountdownValue}
              </span>
            </div>
          )}

          {phase === "sprint-ready" && sprintCountdownValue === null && (
            <SprintReady
              sprintNumber={sprintNumber}
              onGo={startSprintCountdown}
              onEndWorkout={handleEndWorkout}
            />
          )}

          {phase === "sprint-recovery" && (
            <SprintRecovery
              formattedTime={phaseTimer.formattedTime}
              recoveryElapsed={phaseTimer.elapsedSeconds}
              recoveryTargetSeconds={phaseTargetSeconds}
              sprintHistory={sprintHistory}
              bestTime={bestTime}
              onSkipRecovery={handleSkipRecovery}
              onDiscardLast={handleDiscardLastSprint}
              onEditSprint={handleEditSprint}
              onEndWorkout={() => saveAndComplete(false)}
            />
          )}
        </div>
      </div>

      {showDropModal && pendingShortMA !== null && pendingLongMA !== null && (
        <PerformanceDropModal
          shortMA={pendingShortMA}
          longMA={pendingLongMA}
          onContinue={handleDropContinue}
          onEndWorkout={handleDropEnd}
        />
      )}
    </div>
  )
}
