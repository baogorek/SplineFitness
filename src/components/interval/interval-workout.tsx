"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ArrowLeft, Calendar, Volume2, Zap, HeartPulse, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { RoundTimer } from "@/components/circuit/round-timer"
import { IntervalTimer } from "./interval-timer"
import {
  clearIntervalProgress,
  getIntervalProgress,
  saveIntervalProgress,
  saveWorkoutSession,
} from "@/lib/storage"
import { IntervalPhase, IntervalSessionProgress, IntervalWorkoutSession } from "@/types/workout"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"
import {
  INTERVAL_SPEECH_CUES,
  INTERVAL_COMPLETE_CUE,
  INTERVAL_DURATION_SECONDS,
  TOTAL_SETS,
} from "@/data/interval-cues"

interface IntervalWorkoutProps {
  onModeChange: () => void
}

export function IntervalWorkout({ onModeChange }: IntervalWorkoutProps) {
  const [phase, setPhase] = useState<IntervalPhase>("ready")
  const [currentSet, setCurrentSet] = useState(1)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState<IntervalWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [currentNote, setCurrentNote] = useState("")
  const [countdownDisplay, setCountdownDisplay] = useState<string>("")
  const [pendingResume, setPendingResume] = useState<IntervalSessionProgress | null>(null)

  const audio = useAudio()
  useWakeLock(phase !== "complete")
  useNavigationGuard(phase !== "complete")

  const { signInWithGoogle } = useAuth()
  const spokenCuesRef = useRef<Set<number>>(new Set())
  const startedAtRef = useRef<string>("")
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([])
  const setNotesRef = useRef<Record<number, string>>({})
  const noteInputRef = useRef<HTMLInputElement | null>(null)
  const restoredIntervalElapsedRef = useRef<number | null>(null)

  const speedMultiplier = testMode ? 12 : 1

  const workoutTimer = useTimer({ countUp: true, speedMultiplier })
  const restTimer = useTimer({ countUp: true, speedMultiplier })

  useEffect(() => {
    const saved = getIntervalProgress()
    if (saved) {
      setPendingResume(saved)
    }
  }, [])

  const buildSession = useCallback((completedSets: number, endedEarly: boolean): IntervalWorkoutSession => {
    const notes = { ...setNotesRef.current }
    const filtered = Object.fromEntries(Object.entries(notes).filter(([, v]) => v.trim()))
    return {
      mode: "interval",
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
      totalSets: TOTAL_SETS,
      completedSets,
      totalTimeSeconds: workoutTimer.elapsedSeconds,
      ...(Object.keys(filtered).length > 0 && { setNotes: filtered }),
      ...(endedEarly && { endedEarly: true }),
    }
  }, [workoutTimer.elapsedSeconds])

  const intervalTimer = useTimer({
    targetSeconds: INTERVAL_DURATION_SECONDS,
    onTick: (remainingSeconds) => {
      const elapsed = INTERVAL_DURATION_SECONDS - remainingSeconds
      for (const cue of INTERVAL_SPEECH_CUES) {
        if (elapsed >= cue.elapsedSeconds && !spokenCuesRef.current.has(cue.elapsedSeconds)) {
          spokenCuesRef.current.add(cue.elapsedSeconds)
          audio.speak(cue.text)
        }
      }
    },
    onComplete: async () => {
      audio.speak(INTERVAL_COMPLETE_CUE)
      spokenCuesRef.current.clear()
      intervalTimer.reset()
      if (currentSet >= TOTAL_SETS) {
        workoutTimer.pause()
        clearIntervalProgress()
        const session = buildSession(TOTAL_SETS, false)
        setCompletedSessionData(session)
        if (FEATURES.AUTH_ENABLED) {
          const result = await saveWorkoutSession(session)
          setSavedToHistory(result !== null)
        }
        setPhase("complete")
      } else {
        setCurrentSet((prev) => prev + 1)
        setCurrentNote("")
        restTimer.reset()
        restTimer.start()
        setPhase("ready")
      }
    },
    speedMultiplier,
  })

  const clearCountdownTimeouts = useCallback(() => {
    countdownTimeoutsRef.current.forEach(clearTimeout)
    countdownTimeoutsRef.current = []
  }, [])

  useEffect(() => clearCountdownTimeouts, [clearCountdownTimeouts])

  useEffect(() => {
    if (phase === "countdown" || phase === "interval") {
      audio.startKeepalive()
    } else {
      audio.stopKeepalive()
    }
    return () => { audio.stopKeepalive() }
  }, [phase, audio])

  useEffect(() => {
    if (phase !== "interval") return

    const restoredElapsed = restoredIntervalElapsedRef.current
    if (restoredElapsed === null) return

    spokenCuesRef.current = new Set(
      INTERVAL_SPEECH_CUES
        .filter((cue) => cue.elapsedSeconds <= restoredElapsed)
        .map((cue) => cue.elapsedSeconds)
    )
    intervalTimer.resetTo(restoredElapsed)
    restoredIntervalElapsedRef.current = null
    intervalTimer.start()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const getEditableNoteSetNumber = useCallback((phaseValue: IntervalPhase, setNumber: number) => {
    const noteSet = phaseValue === "complete" ? setNumber : setNumber - 1
    return noteSet >= 1 ? noteSet : null
  }, [])

  const syncCompletedSessionNotes = useCallback(() => {
    if (!completedSessionData) return

    const filtered = Object.fromEntries(
      Object.entries(setNotesRef.current).filter(([, value]) => value.trim())
    )

    setCompletedSessionData({
      ...completedSessionData,
      ...(Object.keys(filtered).length > 0 ? { setNotes: filtered } : {}),
    })
  }, [completedSessionData])

  const saveCurrentNote = useCallback((clearInput = false) => {
    const noteSet = getEditableNoteSetNumber(phase, currentSet)
    if (noteSet !== null) {
      const trimmed = currentNote.trim()
      if (trimmed) {
        setNotesRef.current[noteSet] = trimmed
      } else {
        delete setNotesRef.current[noteSet]
      }
    }

    if (phase === "complete") {
      syncCompletedSessionNotes()
    }

    if (clearInput) {
      setCurrentNote("")
    }
  }, [currentNote, currentSet, phase, getEditableNoteSetNumber, syncCompletedSessionNotes])

  const clearIOSUndoStack = useCallback(() => {
    if (typeof document === "undefined") return

    ;(document.activeElement as HTMLElement | null)?.blur()

    const resetInput = document.createElement("input")
    resetInput.type = "text"
    resetInput.readOnly = true
    resetInput.tabIndex = -1
    resetInput.setAttribute("aria-hidden", "true")
    resetInput.style.position = "fixed"
    resetInput.style.opacity = "0"
    resetInput.style.pointerEvents = "none"
    resetInput.style.top = "-1000px"
    resetInput.style.left = "0"
    document.body.appendChild(resetInput)
    resetInput.focus()
    resetInput.blur()
    resetInput.remove()
  }, [])

  const handleNoteBlur = useCallback(() => {
    saveCurrentNote()
    clearIOSUndoStack()
  }, [saveCurrentNote, clearIOSUndoStack])

  const saveProgressSnapshot = useCallback(() => {
    if (phase === "complete" || pendingResume) return
    if (!workoutStarted && phase === "ready" && currentSet === 1 && !currentNote.trim()) return

    const checkpointPhase = phase === "countdown" ? "ready" : phase
    saveIntervalProgress({
      phase: checkpointPhase,
      currentSet,
      workoutStarted,
      startedAt: startedAtRef.current,
      savedAt: new Date().toISOString(),
      workoutTimerSeconds: workoutTimer.elapsedSeconds,
      restTimerSeconds: restTimer.elapsedSeconds,
      intervalElapsedSeconds: phase === "interval" ? intervalTimer.elapsedSeconds : 0,
      currentNote,
      setNotes: { ...setNotesRef.current },
    })
  }, [
    phase,
    pendingResume,
    workoutStarted,
    currentSet,
    currentNote,
    workoutTimer.elapsedSeconds,
    restTimer.elapsedSeconds,
    intervalTimer.elapsedSeconds,
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

  useEffect(() => {
    return () => {
      saveProgressSnapshot()
    }
  }, [saveProgressSnapshot])

  const beginSet = useCallback(() => {
    saveCurrentNote(true)
    clearIOSUndoStack()
    if (!workoutStarted) {
      setWorkoutStarted(true)
      startedAtRef.current = new Date().toISOString()
      workoutTimer.start()
    }
    restTimer.pause()
    restTimer.reset()
    spokenCuesRef.current.clear()
    clearCountdownTimeouts()
  }, [workoutStarted, workoutTimer, restTimer, clearCountdownTimeouts, saveCurrentNote, clearIOSUndoStack])

  const handleStartSet = useCallback(() => {
    beginSet()
    setPhase("countdown")

    const tick = 1000 / speedMultiplier

    audio.speak(`Set ${currentSet}`)
    setCountdownDisplay("5")

    const timeouts = [
      setTimeout(() => { audio.playCountdownTick(); setCountdownDisplay("4") }, tick * 2),
      setTimeout(() => { audio.playCountdownTick(); setCountdownDisplay("3") }, tick * 3),
      setTimeout(() => { audio.playCountdownTick(); setCountdownDisplay("2") }, tick * 4),
      setTimeout(() => { audio.playCountdownTick(); setCountdownDisplay("1") }, tick * 5),
      setTimeout(() => { audio.playCountdownTick(); setCountdownDisplay("GO") }, tick * 6),
      setTimeout(() => {
        audio.playCountdownGo()
        setPhase("interval")
        intervalTimer.reset()
        intervalTimer.start()
      }, tick * 7),
    ]
    countdownTimeoutsRef.current = timeouts
  }, [currentSet, audio, intervalTimer, speedMultiplier, beginSet])

  const handleStartSetImmediate = useCallback(() => {
    beginSet()
    audio.playCountdownGo()
    setPhase("interval")
    intervalTimer.reset()
    intervalTimer.start()
  }, [audio, intervalTimer, beginSet])

  const handleSkipCountdown = useCallback(() => {
    clearCountdownTimeouts()
    audio.playCountdownGo()
    setPhase("interval")
    intervalTimer.reset()
    intervalTimer.start()
  }, [clearCountdownTimeouts, audio, intervalTimer])

  const handleResume = useCallback(() => {
    if (!pendingResume) return

    setWorkoutStarted(pendingResume.workoutStarted)
    startedAtRef.current = pendingResume.startedAt
    setCurrentSet(pendingResume.currentSet)
    setCurrentNote(pendingResume.currentNote)
    setNotesRef.current = { ...pendingResume.setNotes }
    setCountdownDisplay("")
    workoutTimer.resetTo(pendingResume.workoutTimerSeconds)
    restTimer.resetTo(pendingResume.restTimerSeconds)
    intervalTimer.pause()
    intervalTimer.reset()
    spokenCuesRef.current.clear()
    clearCountdownTimeouts()
    setPendingResume(null)

    if (!pendingResume.workoutStarted) {
      setPhase("ready")
      return
    }

    workoutTimer.start()

    if (pendingResume.phase === "interval") {
      restoredIntervalElapsedRef.current = pendingResume.intervalElapsedSeconds
      setPhase("interval")
      return
    }

    if (pendingResume.restTimerSeconds > 0) {
      restTimer.start()
    }
    setPhase("ready")
  }, [pendingResume, workoutTimer, restTimer, intervalTimer, clearCountdownTimeouts])

  const handleDiscardResume = useCallback(() => {
    clearIntervalProgress()
    setPendingResume(null)
    setPhase("ready")
  }, [])

  const handleEndWorkout = useCallback(async () => {
    clearCountdownTimeouts()
    intervalTimer.pause()
    intervalTimer.reset()
    workoutTimer.pause()
    restTimer.pause()
    restTimer.reset()
    clearIntervalProgress()

    const completedSets = phase === "ready" ? currentSet - 1 : currentSet
    saveCurrentNote()
    const session = buildSession(completedSets, true)
    setCompletedSessionData(session)
    if (FEATURES.AUTH_ENABLED) {
      const result = await saveWorkoutSession(session)
      setSavedToHistory(result !== null)
    }
    setPhase("complete")
  }, [phase, currentSet, clearCountdownTimeouts, intervalTimer, workoutTimer, restTimer, buildSession, saveCurrentNote])

  const handleTestAudio = () => {
    audio.speak("Oxidative system approaching VO2 max.")
  }

  const buildGoogleCalendarUrl = (session: IntervalWorkoutSession): string => {
    const toCalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+Z/, "Z")
    const mins = Math.floor(session.totalTimeSeconds / 60)
    const secs = (session.totalTimeSeconds % 60).toString().padStart(2, "0")

    const lines = [
      `Sets: ${session.completedSets}/${session.totalSets}`,
      `Total Time: ${mins}:${secs}`,
    ]

    if (session.setNotes) {
      lines.push("")
      Object.entries(session.setNotes)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([set, note]) => {
          lines.push(`Set ${set}: ${note}`)
        })
    }

    lines.push("", "Session Data:", JSON.stringify(session))

    let details = lines.join("\n")
    if (details.length > 1500) {
      details = details.slice(0, 1497) + "..."
    }

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "4x4 Interval Training",
      dates: `${toCalDate(session.startedAt)}/${toCalDate(session.completedAt || session.startedAt)}`,
      details,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const displayedCompletedSets = completedSessionData?.completedSets ?? TOTAL_SETS

  if (pendingResume) {
    const savedAtLabel = new Date(pendingResume.savedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    const checkpointLabel = pendingResume.phase === "interval"
      ? `Set ${pendingResume.currentSet} in progress`
      : pendingResume.workoutStarted
      ? `Ready for set ${pendingResume.currentSet}`
      : "Before first set"

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center mx-auto">
            <HeartPulse className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume 4x4 Session?</h1>
          <p className="text-muted-foreground">
            You have an in-progress interval session saved on {savedAtLabel}.
          </p>
          <div className="rounded-lg bg-muted/50 p-4 text-left space-y-1">
            <p className="text-sm text-foreground">Checkpoint: {checkpointLabel}</p>
            <p className="text-sm text-muted-foreground">
              {Math.max(0, pendingResume.currentSet - 1)} set{pendingResume.currentSet - 1 === 1 ? "" : "s"} completed
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleResume}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors w-full"
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

  if (phase === "complete") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center mx-auto">
            <HeartPulse className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
          <p className="text-muted-foreground">
            You completed {displayedCompletedSets} {displayedCompletedSets === 1 ? "set" : "sets"} of 4-minute intervals
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
                Sets
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {displayedCompletedSets}/{TOTAL_SETS}
              </p>
            </div>
          </div>

          {displayedCompletedSets > 0 && (
            <div className="mt-4 text-left">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Set {displayedCompletedSets} performance (optional)
              </label>
              <input
                ref={noteInputRef}
                type="text"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onBlur={handleNoteBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    e.currentTarget.blur()
                  }
                }}
                placeholder="e.g. HR 178, RPE 8"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="done"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
              />
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
            className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors w-full"
          >
            Back to Home
          </button>
        </div>
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
              <span className="text-sm font-semibold tracking-tight text-foreground">4X4 INTERVAL</span>
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
            <div className="flex items-center gap-3">
              {workoutStarted && (
                <button
                  onClick={handleEndWorkout}
                  className="flex h-6 px-2 items-center gap-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  <Square className="h-3 w-3" />
                  End
                </button>
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Set {currentSet} of {TOTAL_SETS}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-auto">
        <div className="px-4 pt-4 pb-2 bg-background">
          {workoutStarted && (
            <RoundTimer
              formattedTime={workoutTimer.formattedTime}
              isRunning={workoutTimer.isRunning}
              round={currentSet}
              label="Workout"
            />
          )}

          {phase === "countdown" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Get Ready</p>
              <span className="text-8xl font-mono font-bold text-foreground tabular-nums">
                {countdownDisplay}
              </span>
              <p className="text-lg font-semibold text-red-500">
                Set {currentSet} of {TOTAL_SETS}
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={handleSkipCountdown}
                className="h-14 px-6 text-lg font-semibold"
              >
                Go Now
              </Button>
            </div>
          )}

          {phase === "interval" && (
            <IntervalTimer
              formattedTime={intervalTimer.formattedTime}
              isRunning={intervalTimer.isRunning}
              elapsedSeconds={intervalTimer.elapsedSeconds}
              targetSeconds={INTERVAL_DURATION_SECONDS}
              currentSet={currentSet}
              totalSets={TOTAL_SETS}
              onStart={intervalTimer.start}
              onPause={intervalTimer.pause}
              onReset={intervalTimer.reset}
            />
          )}

          {phase === "ready" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center">
                <HeartPulse className="h-12 w-12 text-red-500" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {currentSet === 1 && !workoutStarted
                    ? "4x4 Interval"
                    : `Set ${currentSet} of ${TOTAL_SETS}`}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {currentSet === 1 && !workoutStarted
                    ? "4 sets of 4-minute high-intensity intervals with physiology coaching"
                    : "Start when you're ready. Your total workout time is running."}
                </p>
              </div>

              {workoutStarted && currentSet > 1 && (
                <div className="w-full max-w-xs">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Set {currentSet - 1} performance (optional)
                  </label>
                  <input
                    ref={noteInputRef}
                    type="text"
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    onBlur={handleNoteBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        e.currentTarget.blur()
                      }
                    }}
                    placeholder="e.g. HR 178, RPE 8"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="done"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {workoutStarted && restTimer.elapsedSeconds > 0 && (
                <p className="text-lg font-mono text-muted-foreground">
                  Rest: {restTimer.formattedTime}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleStartSet}
                  className="h-14 px-8 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
                >
                  Start Set {currentSet}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartSetImmediate}
                  className="h-14 px-6 text-lg font-semibold"
                >
                  Go Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
