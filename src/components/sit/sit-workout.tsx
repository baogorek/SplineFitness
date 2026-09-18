"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ArrowLeft, Calendar, Volume2, Zap, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { RoundTimer } from "@/components/circuit/round-timer"
import { CompletedWorkoutSave } from "@/components/shared/completed-workout-save"
import { SitWarmup } from "./sit-warmup"
import { SprintReady, SprintActive, SprintRecovery } from "./sit-sprint-cycle"
import { PerformanceDropModal } from "./performance-drop-modal"
import {
  clearSitProgress,
  getSitProgress,
  saveSitProgress,
  stageCompletedWorkout,
} from "@/lib/storage"
import { SprintRecord, SitPhase, SitSessionProgress, SitWorkoutSession, SitWarmupProgress } from "@/types/workout"
import { restoreElapsedSeconds } from "@/lib/timer-persistence"
import { BUILD_UP_EFFORTS, BUILD_UP_DISTANCE_METERS, createSitWarmup, isLegacySitWarmup, restoreSitWarmup, SIT_WARMUP_STEPS } from "@/lib/sit-warmup"

interface SitWorkoutProps {
  onModeChange: () => void
  onViewCalendar: () => void
}

const SPRINT_ORIENTATION_PHASES: SitPhase[] = ["sprint-ready", "sprint-active", "sprint-recovery"]

function formatSavedAtLabel(savedAt: string): string {
  return new Date(savedAt).toLocaleString()
}

function getResumeCheckpointLabel(progress: SitSessionProgress): string {
  if (isLegacySitWarmup(progress.phase)) return "Updated guided warmup · restart from easy jogging"
  if (progress.phase === "guided-warmup") return SIT_WARMUP_STEPS[restoreSitWarmup(progress.warmup).stepIndex].title
  return progress.phase === "sprint-recovery" ? "Sprint recovery" : `Sprint ${progress.sprintNumber} ready`
}

export function SitWorkout({ onModeChange, onViewCalendar }: SitWorkoutProps) {
  const [phase, setPhase] = useState<SitPhase>("ready")
  const [warmupProgress, setWarmupProgress] = useState<SitWarmupProgress | null>(null)
  const [sprintNumber, setSprintNumber] = useState(1)
  const [sprintHistory, setSprintHistory] = useState<SprintRecord[]>([])
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [showDropModal, setShowDropModal] = useState(false)
  const [pendingShortMA, setPendingShortMA] = useState<number | null>(null)
  const [pendingLongMA, setPendingLongMA] = useState<number | null>(null)
  const [testMode, setTestMode] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState<SitWorkoutSession | null>(null)
  const [sprintCountdownValue, setSprintCountdownValue] = useState<number | null>(null)
  const [pendingResume, setPendingResume] = useState<SitSessionProgress | null>(null)

  const audio = useAudio()
  const workoutStartedRef = useRef(false)
  const startedAtRef = useRef<string>("")
  const sprintStartRef = useRef<number>(0)
  const sprintStopHandledRef = useRef(false)
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const phasesCompletedRef = useRef(0)
  const restoreTimedPhaseRef = useRef<{
    phase: SitPhase
    elapsedSeconds: number
    isRunning: boolean
  } | null>(null)
  const completionInProgressRef = useRef(false)
  const [resumeDetectedAt] = useState(() => Date.now())

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
    if (phase !== "ready" && phase !== "complete") {
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
  const getWorkoutElapsedSeconds = workoutTimer.getElapsedSeconds
  const workoutTimerRunning = workoutTimer.isRunning

  const phaseTimer = useTimer({ countUp: true, speedMultiplier })
  const getPhaseElapsedSeconds = phaseTimer.getElapsedSeconds
  const phaseTimerRunning = phaseTimer.isRunning

  const clearCountdownTimeouts = useCallback(() => {
    countdownTimeoutsRef.current.forEach(clearTimeout)
    countdownTimeoutsRef.current = []
  }, [])

  useEffect(() => clearCountdownTimeouts, [clearCountdownTimeouts])

  const transitionTo = useCallback((nextPhase: SitPhase) => {
    phaseTimer.pause()
    phaseTimer.reset()
    setPhase(nextPhase)
  }, [phaseTimer])

  useEffect(() => {
    if (phase !== "sprint-recovery") return
    const restoredPhase = restoreTimedPhaseRef.current
    if (restoredPhase?.phase === phase) {
      restoreTimedPhaseRef.current = null
      phaseTimer.resetTo(restoredPhase.elapsedSeconds)
      if (restoredPhase.isRunning) phaseTimer.start()
      return
    }
    phaseTimer.reset()
    phaseTimer.start()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const saveProgressSnapshot = useCallback(() => {
    if (
      completionInProgressRef.current ||
      !workoutStartedRef.current ||
      phase === "ready" ||
      phase === "complete" ||
      pendingResume
    ) {
      return
    }

    const checkpointPhase = phase === "sprint-active" ? "sprint-ready" : phase
    const savedAtMs = Date.now()
    saveSitProgress({
      phase: checkpointPhase,
      warmup: warmupProgress ?? undefined,
      sprintNumber,
      sprintHistory,
      bestTime,
      workoutTimerSeconds: getWorkoutElapsedSeconds(savedAtMs),
      phaseTimerElapsedSeconds: (phase === "sprint-recovery")
        ? getPhaseElapsedSeconds(savedAtMs)
        : 0,
      workoutTimerRunning,
      phaseTimerRunning: (phase === "sprint-recovery") && phaseTimerRunning,
      phasesCompleted: phasesCompletedRef.current,
      startedAt: startedAtRef.current,
      savedAt: new Date(savedAtMs).toISOString(),
    })
  }, [
    phase,
    warmupProgress,
    sprintNumber,
    sprintHistory,
    bestTime,
    getWorkoutElapsedSeconds,
    getPhaseElapsedSeconds,
    workoutTimerRunning,
    phaseTimerRunning,
    pendingResume,
  ])

  useEffect(() => {
    saveProgressSnapshot()
  }, [saveProgressSnapshot, workoutTimer.elapsedSeconds, phaseTimer.elapsedSeconds])

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

  const handleStartWorkout = useCallback(() => {
    workoutStartedRef.current = true
    startedAtRef.current = new Date().toISOString()
    phasesCompletedRef.current = 0
    setWarmupProgress(createSitWarmup())
    workoutTimer.start()
    setPhase("guided-warmup")
  }, [workoutTimer])

  const handleWarmupProgress = useCallback((progress: SitWarmupProgress) => {
    const step = SIT_WARMUP_STEPS[progress.stepIndex]
    phasesCompletedRef.current = step.section === "Progressive runs" ? 2
      : step.section === "Dynamic movement" || progress.status === "done" ? 1 : 0
    setWarmupProgress(progress)
  }, [])

  const handleSkipWarmup = useCallback(() => {
    workoutStartedRef.current = true
    startedAtRef.current = new Date().toISOString()
    phasesCompletedRef.current = 3
    clearCountdownTimeouts()
    phaseTimer.pause()
    phaseTimer.reset()
    setSprintCountdownValue(null)
    workoutTimer.reset()
    workoutTimer.start()
    setPhase("sprint-ready")
  }, [clearCountdownTimeouts, phaseTimer, workoutTimer])

  const handleResume = useCallback(() => {
    if (!pendingResume) return

    const restoredAtMs = resumeDetectedAt
    const workoutWasRunning = pendingResume.workoutTimerRunning
      ?? (pendingResume.phase !== "warmup-countdown")
    const phaseWasRunning = pendingResume.phaseTimerRunning
      ?? (pendingResume.phase === "sprint-recovery")
    const restoredWorkoutElapsed = restoreElapsedSeconds({
      elapsedSeconds: pendingResume.workoutTimerSeconds,
      savedAt: pendingResume.savedAt,
      wasRunning: pendingResume.workoutTimerRunning === true,
      restoredAtMs,
    })

    workoutStartedRef.current = true
    startedAtRef.current = pendingResume.startedAt
    phasesCompletedRef.current = pendingResume.phasesCompleted

    setSprintNumber(pendingResume.sprintNumber)
    setSprintHistory(pendingResume.sprintHistory)
    setBestTime(pendingResume.bestTime)
    setSprintCountdownValue(null)
    setShowDropModal(false)
    setPendingShortMA(null)
    setPendingLongMA(null)
    workoutTimer.resetTo(restoredWorkoutElapsed)
    setPendingResume(null)

    if (pendingResume.phase === "guided-warmup" || isLegacySitWarmup(pendingResume.phase)) {
      const restored = restoreSitWarmup(pendingResume.warmup)
      handleWarmupProgress(restored)
      // Work and setup resume under user control, without guessing what was done away.
      setPhase("guided-warmup")
      return
    }

    if (pendingResume.phase === "sprint-recovery") {
      restoreTimedPhaseRef.current = {
        phase: pendingResume.phase,
        elapsedSeconds: restoreElapsedSeconds({
          elapsedSeconds: pendingResume.phaseTimerElapsedSeconds,
          savedAt: pendingResume.savedAt,
          wasRunning: pendingResume.phaseTimerRunning === true,
          restoredAtMs,
        }),
        isRunning: phaseWasRunning,
      }
      if (workoutWasRunning) workoutTimer.start()
      setPhase(pendingResume.phase)
      return
    }

    if (workoutWasRunning) workoutTimer.start()
    setPhase(pendingResume.phase)
  }, [pendingResume, workoutTimer, resumeDetectedAt, handleWarmupProgress])

  const handleDiscardResume = useCallback(() => {
    clearSitProgress()
    setPendingResume(null)
    setPhase("ready")
  }, [])

  const startSprintCountdown = useCallback(() => {
    clearCountdownTimeouts()
    const tick = 1000 / speedMultiplier

    audio.speak(`Sprint ${sprintNumber}`)
    setSprintCountdownValue(4)

    const timeouts = [
      setTimeout(() => { audio.playCountdownTick(); setSprintCountdownValue(3) }, tick * 1),
      setTimeout(() => { audio.playCountdownTick(); setSprintCountdownValue(2) }, tick * 2),
      setTimeout(() => { audio.playCountdownTick(); setSprintCountdownValue(1) }, tick * 3),
      setTimeout(() => {
        audio.playCountdownGo()
        setSprintCountdownValue(null)
        sprintStopHandledRef.current = false
        sprintStartRef.current = performance.now()
        setPhase("sprint-active")
      }, tick * 4),
    ]
    countdownTimeoutsRef.current = timeouts
  }, [sprintNumber, audio, speedMultiplier, clearCountdownTimeouts])

  const handleSprintStop = useCallback((elapsedSeconds?: number) => {
    if (sprintStopHandledRef.current) return

    sprintStopHandledRef.current = true
    const fallbackElapsed = sprintStartRef.current > 0
      ? (performance.now() - sprintStartRef.current) / 1000
      : 0
    const elapsed = Math.max(0, elapsedSeconds ?? fallbackElapsed)
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
  }, [sprintNumber, bestTime, sprintHistory, phaseTimer, transitionTo])

  const saveAndComplete = useCallback((endedEarly: boolean) => {
    if (completionInProgressRef.current) return
    completionInProgressRef.current = true

    workoutTimer.pause()
    phaseTimer.pause()
    clearCountdownTimeouts()
    phasesCompletedRef.current = endedEarly ? phasesCompletedRef.current : 4

    const session: SitWorkoutSession = {
      mode: "sit",
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
      totalTimeSeconds: getWorkoutElapsedSeconds(),
      sprintTimes: sprintHistory,
      bestSprintTimeSeconds: bestTime,
      phasesCompleted: phasesCompletedRef.current,
      endedEarly,
    }

    setCompletedSessionData(stageCompletedWorkout(session) as SitWorkoutSession)
    setPhase("complete")
  }, [workoutTimer, phaseTimer, sprintHistory, bestTime, clearCountdownTimeouts, getWorkoutElapsedSeconds])

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
    audio.speak("Audio is ready. Wait for the Go cue before starting.")
  }

  if (pendingResume) {
    const savedAtLabel = formatSavedAtLabel(pendingResume.savedAt)
    const completedSprints = pendingResume.sprintHistory.length

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mx-auto">
            <Zap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume SIT Session?</h1>
          <p className="text-muted-foreground">
            You have an in-progress sprint session saved at {savedAtLabel}.
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
            <Button variant="outline" onClick={onViewCalendar} className="h-12 w-full gap-2">
              <Calendar className="h-4 w-4" />
              View Workout Calendar
            </Button>
          )}

          {completedSessionData && <CompletedWorkoutSave session={completedSessionData} />}

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
                type="button"
                aria-pressed={testMode}
                disabled={phase !== "ready"}
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
                type="button"
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
                  Easy jogging, dynamic movement, then four progressive build-ups with walk-back recovery.
                </p>
              </div>
              <div className="max-w-sm rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
                <p>3 minutes easy jogging → brief marching, leg swings and ankle rocks → {BUILD_UP_EFFORTS.map((effort) => `${effort}%`).join(" / ")} build-ups.</p>
                <p className="mt-2">Use about {BUILD_UP_DISTANCE_METERS} m of clear, level space, with room to slow down. Percentages are rough speed guides. Recover for a minute between runs and 3 minutes after the last; take longer or repeat a run as needed.</p>
                <p className="mt-2">Every movement waits for your start. Warmup runs stay out of your sprint records.</p>
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

          {phase === "guided-warmup" && (
            <SitWarmup
              audio={audio}
              initialProgress={warmupProgress}
              speedMultiplier={speedMultiplier}
              onProgress={handleWarmupProgress}
              onClockRunning={(running) => { if (running) workoutTimer.start(); else workoutTimer.pause() }}
              onComplete={() => {
                phasesCompletedRef.current = 3
                workoutTimer.start()
                transitionTo("sprint-ready")
              }}
              onEndWorkout={handleEndWorkout}
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
