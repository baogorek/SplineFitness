"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Square,
  Timer,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAudio } from "@/hooks/use-audio"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useTimer } from "@/hooks/use-timer"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { saveWorkoutSession } from "@/lib/storage"
import { FEATURES } from "@/lib/feature-flags"
import { useAuth } from "@/components/auth-provider"
import { Vo2MaxWorkoutSession } from "@/types/workout"

interface Vo2MaxWorkoutProps {
  onModeChange: () => void
}

type Vo2Stage = "setup" | "timer" | "entry" | "complete"

const DEFAULT_START_OFFSET_MILES = 0.1
const DEFAULT_DURATION_SECONDS = 12 * 60
const INCLINE_PERCENT = 1
const START_OFFSET_OPTIONS = [0.1, 0.2, 0.25]
const MIN_REASONABLE_DISTANCE_MILES = 0.5
const MAX_REASONABLE_DISTANCE_MILES = 3
const METERS_PER_MILE = 1609.344

interface Vo2Metrics {
  testDistanceMiles: number
  testDistanceMeters: number
  vo2Max: number
  mets: number
  averagePaceSecondsPerMile: number
  averageSpeedMph: number
}

function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed || !/^\d*\.?\d+$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function formatDistanceInput(distance: number): string {
  return distance.toFixed(2)
}

function formatPace(secondsPerMile: number): string {
  if (!Number.isFinite(secondsPerMile) || secondsPerMile <= 0) return "--"
  const roundedSeconds = Math.round(secondsPerMile)
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = roundedSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}/mi`
}

function calculateMetrics(
  finalDistanceMiles: number,
  startOffsetMiles: number,
  durationSeconds: number
): Vo2Metrics {
  const testDistanceMiles = finalDistanceMiles - startOffsetMiles
  const testDistanceMeters = testDistanceMiles * METERS_PER_MILE
  const vo2Max = (testDistanceMeters - 504.9) / 44.73
  const mets = vo2Max / 3.5
  const durationHours = durationSeconds / 3600

  return {
    testDistanceMiles,
    testDistanceMeters,
    vo2Max,
    mets,
    averagePaceSecondsPerMile: durationSeconds / testDistanceMiles,
    averageSpeedMph: testDistanceMiles / durationHours,
  }
}

function Vo2MaxResultPanel({ value }: { value: number }) {
  return (
    <div className="rounded-lg border-2 border-cyan-600 bg-cyan-600/10 p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
        Relative VO2 Max
      </p>
      <p className="mt-2 text-6xl font-black tabular-nums tracking-normal text-cyan-600">
        {value.toFixed(1)}
      </p>
      <p className="mt-1 text-base font-semibold text-cyan-700">mL/kg/min</p>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
        Body-mass scaled oxygen uptake in milliliters per kilogram per minute.
      </p>
    </div>
  )
}

export function Vo2MaxWorkout({ onModeChange }: Vo2MaxWorkoutProps) {
  const [stage, setStage] = useState<Vo2Stage>("setup")
  const [startOffsetInput, setStartOffsetInput] = useState(formatDistanceInput(DEFAULT_START_OFFSET_MILES))
  const [setupError, setSetupError] = useState("")
  const [testMode, setTestMode] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [endedEarly, setEndedEarly] = useState(false)
  const [finishedDurationSeconds, setFinishedDurationSeconds] = useState(DEFAULT_DURATION_SECONDS)
  const [finalDistanceInput, setFinalDistanceInput] = useState("")
  const [resultStartOffsetInput, setResultStartOffsetInput] = useState(formatDistanceInput(DEFAULT_START_OFFSET_MILES))
  const [calculatedMetrics, setCalculatedMetrics] = useState<Vo2Metrics | null>(null)
  const [calculationError, setCalculationError] = useState("")
  const [completedSessionData, setCompletedSessionData] = useState<Vo2MaxWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const audio = useAudio()
  const { signInWithGoogle } = useAuth()
  const startedAtRef = useRef("")
  const completedAtRef = useRef("")
  const lastTickRemainingRef = useRef(-1)
  const speedMultiplier = testMode ? 12 : 1

  const handleTimerComplete = useCallback(() => {
    audio.playCompleteSound()
    navigator.vibrate?.([350, 120, 350])
    completedAtRef.current = new Date().toISOString()
    setFinishedDurationSeconds(DEFAULT_DURATION_SECONDS)
    setEndedEarly(false)
    setStage("entry")
  }, [audio])

  const {
    elapsedSeconds,
    formattedTime,
    isRunning,
    remainingSeconds,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = useTimer({
    targetSeconds: DEFAULT_DURATION_SECONDS,
    onTick: (remaining) => {
      if (remaining > 5) {
        lastTickRemainingRef.current = -1
      }
      if (remaining >= 1 && remaining <= 5 && remaining !== lastTickRemainingRef.current) {
        lastTickRemainingRef.current = remaining
        audio.playCountdownTick()
      }
    },
    onComplete: handleTimerComplete,
    speedMultiplier,
  })

  const wakeLockActive = stage === "timer" || stage === "entry"
  const audioKeepaliveActive = stage === "timer" && timerStarted
  useWakeLock(wakeLockActive)
  useNavigationGuard(wakeLockActive)

  useEffect(() => {
    if (audioKeepaliveActive) {
      audio.startKeepalive()
    } else {
      audio.stopKeepalive()
    }
    return () => {
      audio.stopKeepalive()
    }
  }, [audioKeepaliveActive, audio])

  const setupStartOffsetMiles = useMemo(() => parseDecimalInput(startOffsetInput), [startOffsetInput])
  const currentStartOffsetMiles = useMemo(
    () => parseDecimalInput(resultStartOffsetInput),
    [resultStartOffsetInput]
  )
  const finalDistanceMiles = useMemo(() => parseDecimalInput(finalDistanceInput), [finalDistanceInput])

  const resetCalculation = useCallback(() => {
    setCalculatedMetrics(null)
    setCalculationError("")
  }, [])

  const validateAndCalculate = useCallback(() => {
    if (finalDistanceInput.trim() === "") {
      return {
        message: "Enter the final treadmill distance shown at the end of the test.",
        metrics: null as Vo2Metrics | null,
      }
    }

    if (endedEarly) {
      return {
        message: "VO2 Max requires the full 12:00 Cooper test. Restart when you are ready to run the complete test.",
        metrics: null,
      }
    }

    if (finalDistanceMiles === null) {
      return { message: "Final distance must be a decimal number in miles.", metrics: null }
    }

    if (currentStartOffsetMiles === null) {
      return { message: "Start offset must be a decimal number in miles.", metrics: null }
    }

    if (currentStartOffsetMiles < 0) {
      return { message: "Start offset cannot be negative.", metrics: null }
    }

    if (finalDistanceMiles <= currentStartOffsetMiles) {
      return { message: "Final distance must be greater than the start offset.", metrics: null }
    }

    const testDistanceMiles = finalDistanceMiles - currentStartOffsetMiles
    if (
      testDistanceMiles < MIN_REASONABLE_DISTANCE_MILES ||
      testDistanceMiles > MAX_REASONABLE_DISTANCE_MILES
    ) {
      return {
        message: `Test distance should be between ${MIN_REASONABLE_DISTANCE_MILES.toFixed(1)} and ${MAX_REASONABLE_DISTANCE_MILES.toFixed(1)} miles.`,
        metrics: null,
      }
    }

    return {
      message: "",
      metrics: calculateMetrics(finalDistanceMiles, currentStartOffsetMiles, DEFAULT_DURATION_SECONDS),
    }
  }, [
    currentStartOffsetMiles,
    endedEarly,
    finalDistanceInput,
    finalDistanceMiles,
  ])

  const durationLabel = formatDuration(DEFAULT_DURATION_SECONDS)

  const handleCalculateResult = useCallback(() => {
    const result = validateAndCalculate()
    setCalculationError(result.message)
    setCalculatedMetrics(result.metrics)
  }, [validateAndCalculate])

  const handleEnterTimer = useCallback(() => {
    const parsedOffset = parseDecimalInput(startOffsetInput)

    if (parsedOffset === null || parsedOffset < 0 || parsedOffset > 1) {
      setSetupError("Start offset must be between 0.00 and 1.00 miles.")
      return
    }

    setSetupError("")
    setFinishedDurationSeconds(DEFAULT_DURATION_SECONDS)
    setResultStartOffsetInput(formatDistanceInput(parsedOffset))
    setFinalDistanceInput("")
    resetCalculation()
    setCompletedSessionData(null)
    setSavedToHistory(false)
    setEndedEarly(false)
    setTimerStarted(false)
    startedAtRef.current = ""
    completedAtRef.current = ""
    lastTickRemainingRef.current = -1
    pauseTimer()
    resetTimer()
    setStage("timer")
  }, [pauseTimer, resetCalculation, resetTimer, startOffsetInput])

  const handleStartTimer = useCallback(() => {
    if (!timerStarted) {
      startedAtRef.current = new Date().toISOString()
      setTimerStarted(true)
      setEndedEarly(false)
    }
    startTimer()
  }, [startTimer, timerStarted])

  const handleCancelTimer = useCallback(() => {
    pauseTimer()
    resetTimer()
    setTimerStarted(false)
    setEndedEarly(false)
    setFinishedDurationSeconds(DEFAULT_DURATION_SECONDS)
    startedAtRef.current = ""
    completedAtRef.current = ""
    lastTickRemainingRef.current = -1
    setStage("setup")
  }, [pauseTimer, resetTimer])

  const handleFinishEarly = useCallback(() => {
    if (!timerStarted) return
    pauseTimer()
    completedAtRef.current = new Date().toISOString()
    setFinishedDurationSeconds(Math.max(1, elapsedSeconds))
    setEndedEarly(true)
    setStage("entry")
  }, [elapsedSeconds, pauseTimer, timerStarted])

  const handleSaveResult = useCallback(async () => {
    if (!calculatedMetrics || finalDistanceMiles === null || currentStartOffsetMiles === null) return

    const completedAt = completedAtRef.current || new Date().toISOString()
    const session: Vo2MaxWorkoutSession = {
      mode: "vo2max",
      startedAt: startedAtRef.current || completedAt,
      completedAt,
      durationSeconds: finishedDurationSeconds,
      startOffsetMiles: currentStartOffsetMiles,
      finalDistanceMiles,
      testDistanceMiles: calculatedMetrics.testDistanceMiles,
      testDistanceMeters: calculatedMetrics.testDistanceMeters,
      vo2Max: calculatedMetrics.vo2Max,
      mets: calculatedMetrics.mets,
      averagePaceSecondsPerMile: calculatedMetrics.averagePaceSecondsPerMile,
      averageSpeedMph: calculatedMetrics.averageSpeedMph,
      inclinePercent: INCLINE_PERCENT,
      endedEarly,
    }

    setIsSaving(true)
    setCompletedSessionData(session)
    if (FEATURES.AUTH_ENABLED) {
      const result = await saveWorkoutSession(session)
      setSavedToHistory(result !== null)
    }
    setIsSaving(false)
    setStage("complete")
  }, [
    calculatedMetrics,
    currentStartOffsetMiles,
    endedEarly,
    finalDistanceMiles,
    finishedDurationSeconds,
  ])

  const handleRepeatSameSetup = useCallback(() => {
    pauseTimer()
    resetTimer()
    setStartOffsetInput(resultStartOffsetInput)
    setFinalDistanceInput("")
    resetCalculation()
    setCompletedSessionData(null)
    setSavedToHistory(false)
    setIsSaving(false)
    setTimerStarted(false)
    setEndedEarly(false)
    setFinishedDurationSeconds(DEFAULT_DURATION_SECONDS)
    startedAtRef.current = ""
    completedAtRef.current = ""
    lastTickRemainingRef.current = -1
    setStage("setup")
  }, [pauseTimer, resetCalculation, resetTimer, resultStartOffsetInput])

  const buildGoogleCalendarUrl = (session: Vo2MaxWorkoutSession): string => {
    const toCalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+Z/, "Z")
    const lines = [
      `Relative VO2 Max: ${session.vo2Max.toFixed(1)} mL/kg/min`,
      "Interpretation: body-mass scaled oxygen uptake in milliliters per kilogram per minute.",
      `METs: ${session.mets.toFixed(1)}`,
      `Test Distance: ${session.testDistanceMiles.toFixed(2)} mi (${Math.round(session.testDistanceMeters)} m)`,
      `Final Treadmill Distance: ${session.finalDistanceMiles.toFixed(2)} mi`,
      `Start Offset: ${session.startOffsetMiles.toFixed(2)} mi`,
      `Duration: ${formatDuration(session.durationSeconds)}`,
      `Average Pace: ${formatPace(session.averagePaceSecondsPerMile)}`,
      `Average Speed: ${session.averageSpeedMph.toFixed(1)} mph`,
      `Incline: ${session.inclinePercent}%`,
    ]

    if (session.endedEarly) {
      lines.push("Ended Early: yes")
    }
    lines.push("", "Session Data:", JSON.stringify(session))

    let details = lines.join("\n")
    if (details.length > 1500) {
      details = details.slice(0, 1497) + "..."
    }

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "VO2 Max Treadmill Cooper Test",
      dates: `${toCalDate(session.startedAt)}/${toCalDate(session.completedAt || session.startedAt)}`,
      details,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  if (stage === "complete" && completedSessionData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-600">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">VO2 Max Recorded</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Treadmill Cooper estimate from {completedSessionData.testDistanceMiles.toFixed(2)} miles.
            </p>
          </div>

          <Vo2MaxResultPanel value={completedSessionData.vo2Max} />

          <a
            href={buildGoogleCalendarUrl(completedSessionData)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Calendar className="h-4 w-4" />
            Add to Google Calendar
          </a>
          <p className="text-center text-sm font-semibold text-amber-500">
            Remember to tap Save in Google Calendar!
          </p>

          {FEATURES.AUTH_ENABLED && (
            savedToHistory ? (
              <div className="rounded-lg border border-green-600/20 bg-green-600/10 p-3">
                <p className="text-sm font-medium text-green-600">Saved to workout history</p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-600/20 bg-amber-600/10 p-4">
                <p className="text-sm font-medium text-amber-600">
                  Sign in to save your VO2 Max estimates and track progress over time.
                </p>
                <Button variant="outline" size="sm" onClick={signInWithGoogle} className="mt-3">
                  Sign in with Google
                </Button>
              </div>
            )
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={handleRepeatSameSetup} className="h-12 gap-2">
              <RotateCcw className="h-4 w-4" />
              Repeat Setup
            </Button>
            <Button onClick={onModeChange} className="h-12">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            {stage === "setup" ? (
              <Button variant="outline" size="sm" onClick={onModeChange} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <span className="flex h-8 items-center rounded-md px-1 text-sm font-semibold tracking-tight text-foreground">
                VO2 MAX
              </span>
            )}
            <button
              onClick={() => setTestMode(!testMode)}
              className={`flex h-6 items-center gap-1 rounded px-2 text-xs font-medium transition-colors ${
                testMode
                  ? "bg-yellow-500 text-yellow-950"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3 w-3" />
              {testMode ? "12x" : "Test"}
            </button>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Gauge className="h-4 w-4 text-cyan-600" />
            Treadmill
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 p-4 pb-8">
        {stage === "setup" && (
          <>
            <section className="space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-cyan-600 text-white">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Treadmill Cooper Test</h1>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  Warm up first. Then use the first 0.10-0.20 miles as your ramp-up zone.
                  Start the timer only once you are already running at your planned opening speed.
                </p>
              </div>
            </section>

            <section className="space-y-5 rounded-lg border border-border bg-card p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-foreground" htmlFor="vo2-start-offset">
                    Start distance offset
                  </label>
                  <span className="text-xs text-muted-foreground">miles</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {START_OFFSET_OPTIONS.map((offset) => {
                    const isSelected = setupStartOffsetMiles !== null && Math.abs(setupStartOffsetMiles - offset) < 0.001
                    return (
                      <Button
                        key={offset}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setStartOffsetInput(formatDistanceInput(offset))}
                        className="h-12 text-base"
                      >
                        {formatDistanceInput(offset)}
                      </Button>
                    )
                  })}
                </div>
                <Input
                  id="vo2-start-offset"
                  inputMode="decimal"
                  value={startOffsetInput}
                  onChange={(event) => setStartOffsetInput(event.target.value)}
                  className="h-14 text-lg"
                  aria-label="Custom start offset in miles"
                />
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Test duration
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  12:00
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cooper VO2 Max estimates use the distance covered in exactly 12 minutes.
                </p>
              </div>

              <div className="rounded-lg bg-cyan-600/10 p-4">
                <p className="text-sm font-semibold text-cyan-700">Recommended treadmill incline: 1%</p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Use the starting distance as your ramp-up zone. Be at your opening test speed before you start the timer.
                </p>
              </div>

              {setupError && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  {setupError}
                </p>
              )}

              <Button onClick={handleEnterTimer} className="h-16 w-full gap-2 text-lg font-bold">
                <Timer className="h-5 w-5" />
                Start 12:00 Test
              </Button>
            </section>
          </>
        )}

        {stage === "timer" && (
          <section className="space-y-6 py-2">
            <div className="space-y-5 text-center">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Start when treadmill reaches
                </p>
                <p className="mt-2 text-4xl font-bold text-cyan-600">
                  {Number(resultStartOffsetInput).toFixed(2)} mi
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {timerStarted ? (isRunning ? "Running" : "Paused") : "Ready"}
                </p>
                <div className="text-7xl font-black tabular-nums tracking-normal text-foreground sm:text-8xl">
                  {formattedTime}
                </div>
                <p className="text-base font-medium text-muted-foreground">
                  Elapsed {formatDuration(elapsedSeconds)} / {durationLabel}
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-lg font-semibold text-foreground">Run hard for {durationLabel}.</p>
                <p className="mt-1 text-sm text-muted-foreground">Do not hold the rails.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleStartTimer}
                disabled={isRunning || remainingSeconds === 0}
                className="h-16 gap-2 text-lg font-bold"
              >
                <Play className="h-5 w-5" />
                {timerStarted ? "Resume" : "Start"}
              </Button>
              <Button
                onClick={pauseTimer}
                disabled={!isRunning}
                variant="outline"
                className="h-16 gap-2 text-lg font-bold"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
              <Button onClick={handleCancelTimer} variant="outline" className="h-14 gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleFinishEarly}
                disabled={!timerStarted || elapsedSeconds === 0}
                variant="outline"
                className="h-14 gap-2"
              >
                <Square className="h-4 w-4" />
                Finish Early
              </Button>
            </div>
          </section>
        )}

        {stage === "entry" && (
          <section className="space-y-5">
            <div className="space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-600 text-white">
                <Flag className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Stop test. Enter treadmill distance.</h1>
              <p className="text-base leading-7 text-muted-foreground">
                Enter the treadmill distance shown at exactly 12:00.
                The app will subtract your starting offset.
              </p>
            </div>

            <div className="space-y-5 rounded-lg border border-border bg-card p-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="vo2-final-distance">
                  Final treadmill distance
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="vo2-final-distance"
                    inputMode="decimal"
                    value={finalDistanceInput}
                    onChange={(event) => {
                      setFinalDistanceInput(event.target.value)
                      resetCalculation()
                    }}
                    className="h-16 text-2xl font-bold"
                    aria-label="Final treadmill distance in miles"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">mi</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-foreground" htmlFor="vo2-result-offset">
                    Start offset
                  </label>
                  <span className="text-xs text-muted-foreground">editable</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {START_OFFSET_OPTIONS.map((offset) => {
                    const isSelected = currentStartOffsetMiles !== null && Math.abs(currentStartOffsetMiles - offset) < 0.001
                    return (
                      <Button
                        key={offset}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => {
                          setResultStartOffsetInput(formatDistanceInput(offset))
                          resetCalculation()
                        }}
                        className="h-11"
                      >
                        {formatDistanceInput(offset)}
                      </Button>
                    )
                  })}
                </div>
                <Input
                  id="vo2-result-offset"
                  inputMode="decimal"
                  value={resultStartOffsetInput}
                  onChange={(event) => {
                    setResultStartOffsetInput(event.target.value)
                    resetCalculation()
                  }}
                  className="h-12 text-lg"
                  aria-label="Start offset in miles"
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-mono">Test distance = final treadmill distance - start offset</p>
                {calculatedMetrics && finalDistanceMiles !== null && currentStartOffsetMiles !== null && (
                  <p className="mt-2 font-mono text-foreground">
                    {finalDistanceMiles.toFixed(2)} mi - {currentStartOffsetMiles.toFixed(2)} mi = {calculatedMetrics.testDistanceMiles.toFixed(2)} mi
                  </p>
                )}
              </div>

              {calculationError && (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm font-medium text-amber-600">
                  {calculationError}
                </p>
              )}

              {!calculatedMetrics && !endedEarly && (
                <Button
                  onClick={handleCalculateResult}
                  className="h-16 w-full gap-2 text-lg font-bold"
                >
                  <Gauge className="h-5 w-5" />
                  Calculate VO2 Max
                </Button>
              )}

              {calculatedMetrics && (
                <Vo2MaxResultPanel value={calculatedMetrics.vo2Max} />
              )}

              {endedEarly && (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700">
                  Cooper VO2 Max estimates require the full 12:00 test. This stopped at {formatDuration(finishedDurationSeconds)}, so no estimate will be saved.
                </p>
              )}

              {calculatedMetrics && (
                <Button
                  onClick={handleSaveResult}
                  disabled={isSaving}
                  className="h-16 w-full gap-2 text-lg font-bold"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {isSaving ? "Saving..." : "Record VO2 Max Estimate"}
                </Button>
              )}
              <Button variant="outline" onClick={onModeChange} className="h-12 w-full">
                Back to Home
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
