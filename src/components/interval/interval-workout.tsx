"use client"

import { useState, useRef, useCallback } from "react"
import { ArrowLeft, Calendar, Volume2, Zap, HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import { RoundTimer } from "@/components/circuit/round-timer"
import { IntervalTimer } from "./interval-timer"
import { saveWorkoutSession } from "@/lib/storage"
import { IntervalWorkoutSession } from "@/types/workout"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"
import {
  INTERVAL_SPEECH_CUES,
  INTERVAL_COMPLETE_CUE,
  INTERVAL_DURATION_SECONDS,
  TOTAL_SETS,
} from "@/data/interval-cues"

type IntervalPhase = "ready" | "countdown" | "interval" | "complete"

interface IntervalWorkoutProps {
  onModeChange: () => void
}

export function IntervalWorkout({ onModeChange }: IntervalWorkoutProps) {
  const [phase, setPhase] = useState<IntervalPhase>("ready")
  const [currentSet, setCurrentSet] = useState(1)
  const [testMode, setTestMode] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState<IntervalWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)

  const audio = useAudio()
  const { signInWithGoogle } = useAuth()
  const spokenCuesRef = useRef<Set<number>>(new Set())
  const workoutStartedRef = useRef(false)
  const startedAtRef = useRef<string>("")
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  const speedMultiplier = testMode ? 12 : 1

  const workoutTimer = useTimer({ countUp: true, speedMultiplier })

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
        const session: IntervalWorkoutSession = {
          mode: "interval",
          startedAt: startedAtRef.current,
          completedAt: new Date().toISOString(),
          totalSets: TOTAL_SETS,
          completedSets: TOTAL_SETS,
          totalTimeSeconds: workoutTimer.elapsedSeconds,
        }
        setCompletedSessionData(session)
        if (FEATURES.AUTH_ENABLED) {
          const result = await saveWorkoutSession(session)
          setSavedToHistory(result !== null)
        }
        setPhase("complete")
      } else {
        setCurrentSet((prev) => prev + 1)
        setPhase("ready")
      }
    },
    speedMultiplier,
  })

  const countdownTimer = useTimer({
    targetSeconds: 7,
    onComplete: () => {
      countdownTimer.reset()
    },
    speedMultiplier,
  })

  const clearCountdownTimeouts = useCallback(() => {
    countdownTimeoutsRef.current.forEach(clearTimeout)
    countdownTimeoutsRef.current = []
  }, [])

  const handleStartSet = useCallback(() => {
    if (!workoutStartedRef.current) {
      workoutStartedRef.current = true
      startedAtRef.current = new Date().toISOString()
      workoutTimer.start()
    }
    spokenCuesRef.current.clear()
    clearCountdownTimeouts()
    setPhase("countdown")

    const tick = 1000 / speedMultiplier

    // "Set X" speech, then 5 beeps at 1-second intervals, then go
    audio.speak(`Set ${currentSet}`)
    countdownTimer.reset()
    countdownTimer.start()

    const timeouts = [
      setTimeout(() => audio.playCountdownTick(), tick * 2),
      setTimeout(() => audio.playCountdownTick(), tick * 3),
      setTimeout(() => audio.playCountdownTick(), tick * 4),
      setTimeout(() => audio.playCountdownTick(), tick * 5),
      setTimeout(() => audio.playCountdownTick(), tick * 6),
      setTimeout(() => {
        audio.playCountdownGo()
        countdownTimer.reset()
        setPhase("interval")
        intervalTimer.reset()
        intervalTimer.start()
      }, tick * 7),
    ]
    countdownTimeoutsRef.current = timeouts
  }, [currentSet, audio, countdownTimer, intervalTimer, workoutTimer, speedMultiplier, clearCountdownTimeouts])

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
      "",
      "Session Data:",
      JSON.stringify(session),
    ]

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

  if (phase === "complete") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center mx-auto">
            <HeartPulse className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
          <p className="text-muted-foreground">
            You completed {TOTAL_SETS} sets of 4-minute intervals
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
                {TOTAL_SETS}/{TOTAL_SETS}
              </p>
            </div>
          </div>

          {completedSessionData && (
            <a
              href={buildGoogleCalendarUrl(completedSessionData)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors w-full mt-2"
            >
              <Calendar className="h-4 w-4" />
              Add to Google Calendar
            </a>
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
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Set {currentSet} of {TOTAL_SETS}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-background">
          {workoutStartedRef.current && (
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
              <span className="text-6xl font-mono font-bold text-foreground tabular-nums">
                {countdownTimer.formattedTime}
              </span>
              <p className="text-lg font-semibold text-red-500">
                Set {currentSet} of {TOTAL_SETS}
              </p>
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
                  {currentSet === 1 && !workoutStartedRef.current
                    ? "4x4 Interval"
                    : `Set ${currentSet} of ${TOTAL_SETS}`}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {currentSet === 1 && !workoutStartedRef.current
                    ? "4 sets of 4-minute high-intensity intervals with physiology coaching"
                    : "Start when you're ready. Your total workout time is running."}
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleStartSet}
                className="h-14 px-8 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
              >
                Start Set {currentSet}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
