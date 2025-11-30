"use client"

import { useState, useCallback, useRef } from "react"
import { Activity, ArrowLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  WorkoutVariant,
  CircuitRoundData,
  ComboLoadMetrics,
  CircuitWorkoutSession,
} from "@/types/workout"
import { circuitWorkouts } from "@/data/circuit-workouts"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import { saveWorkoutSession } from "@/lib/storage"
import { ComboCard } from "./combo-card"
import { ComboTimer } from "./combo-timer"
import { RoundTimer } from "./round-timer"
import { LoadInputModal } from "./load-input-modal"
import { RoundSummary } from "./round-summary"

type Phase = "ready" | "timing" | "input" | "round-complete" | "workout-complete"

interface CircuitWorkoutProps {
  onModeChange: () => void
}

export function CircuitWorkout({ onModeChange }: CircuitWorkoutProps) {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutVariant>("A")
  const [currentRound, setCurrentRound] = useState(1)
  const [currentComboIndex, setCurrentComboIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("ready")
  const [rounds, setRounds] = useState<CircuitRoundData[]>([])
  const [currentRoundMetrics, setCurrentRoundMetrics] = useState<ComboLoadMetrics[]>([])
  const [testMode, setTestMode] = useState(false)
  const savingRef = useRef(false)

  const workout = circuitWorkouts[activeWorkout]
  const currentCombo = workout.combos[currentComboIndex]
  const speedMultiplier = testMode ? 12 : 1

  const audio = useAudio()

  const comboTimer = useTimer({
    targetSeconds: currentCombo?.durationSeconds || 180,
    onMinuteMark: (minute) => {
      const maxMinutes = Math.floor((currentCombo?.durationSeconds || 180) / 60)
      if (minute < maxMinutes) {
        audio.playMinuteBeep()
      }
    },
    onComplete: () => {
      audio.playCompleteSound()
      setPhase("input")
    },
    speedMultiplier,
  })

  const roundTimer = useTimer({ countUp: true, speedMultiplier })

  const handleWorkoutChange = (variant: WorkoutVariant) => {
    if (phase === "ready" && currentComboIndex === 0 && rounds.length === 0) {
      setActiveWorkout(variant)
    }
  }

  const handleStartCombo = useCallback(() => {
    setPhase("timing")
    comboTimer.start()
    if (!roundTimer.isRunning) {
      roundTimer.start()
    }
  }, [comboTimer, roundTimer])

  const handleSaveLoad = useCallback(
    (loads: Record<string, number>) => {
      const metric: ComboLoadMetrics = {
        comboId: currentCombo.id,
        round: currentRound,
        subExerciseLoads: loads,
      }

      const updatedMetrics = [...currentRoundMetrics, metric]
      setCurrentRoundMetrics(updatedMetrics)

      comboTimer.reset()

      if (currentComboIndex < workout.combos.length - 1) {
        setCurrentComboIndex((prev) => prev + 1)
        setPhase("ready")
      } else {
        roundTimer.pause()
        const roundData: CircuitRoundData = {
          round: currentRound,
          totalTimeSeconds: roundTimer.elapsedSeconds,
          comboMetrics: updatedMetrics,
          completedAt: new Date().toISOString(),
        }
        setRounds((prev) => [...prev, roundData])
        setPhase("round-complete")
      }
    },
    [currentCombo, currentComboIndex, currentRound, currentRoundMetrics, workout.combos.length, comboTimer, roundTimer]
  )

  const handleStartNextRound = useCallback(() => {
    setCurrentRound((prev) => prev + 1)
    setCurrentComboIndex(0)
    setCurrentRoundMetrics([])
    roundTimer.reset()
    setPhase("ready")
  }, [roundTimer])

  const handleFinishWorkout = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true

    const session: CircuitWorkoutSession = {
      mode: "circuit",
      workoutId: workout.id,
      variant: activeWorkout,
      startedAt: new Date(Date.now() - rounds.reduce((acc, r) => acc + r.totalTimeSeconds * 1000, 0)).toISOString(),
      completedAt: new Date().toISOString(),
      rounds: rounds,
    }
    await saveWorkoutSession(session)
    setPhase("workout-complete")
  }, [workout.id, activeWorkout, rounds])

  const completedCombos = currentRoundMetrics.length
  const totalCombos = workout.combos.length
  const progressPercent = totalCombos > 0 ? (completedCombos / totalCombos) * 100 : 0

  if (phase === "workout-complete") {
    const totalTime = rounds.reduce((acc, r) => acc + r.totalTimeSeconds, 0)
    const avgLoad = Math.round(
      rounds.flatMap(r => r.comboMetrics).reduce((acc, m) => {
        const loads = Object.values(m.subExerciseLoads)
        return acc + loads.reduce((a, b) => a + b, 0) / loads.length
      }, 0) / rounds.flatMap(r => r.comboMetrics).length
    )

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center mx-auto">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
          <p className="text-muted-foreground">
            You completed {rounds.length} round{rounds.length !== 1 ? "s" : ""} of {workout.name}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Time</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Load</p>
              <p className="text-2xl font-mono font-bold text-foreground">{avgLoad}%</p>
            </div>
          </div>

          <div className="rounded-lg bg-green-600/10 border border-green-600/20 p-3 mt-4">
            <p className="text-sm text-green-600 font-medium">Saved to workout history</p>
          </div>

          <button
            onClick={onModeChange}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors w-full"
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onModeChange} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="text-sm font-semibold tracking-tight text-foreground">CIRCUIT</span>
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
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Round {currentRound}</p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {completedCombos}/{totalCombos} combos
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => handleWorkoutChange("A")}
                disabled={phase !== "ready" || currentComboIndex > 0 || rounds.length > 0}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeWorkout === "A"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground disabled:opacity-50"
                }`}
              >
                Workout A
              </button>
              <button
                onClick={() => handleWorkoutChange("B")}
                disabled={phase !== "ready" || currentComboIndex > 0 || rounds.length > 0}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeWorkout === "B"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground disabled:opacity-50"
                }`}
              >
                Workout B
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 relative">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    className="stroke-primary transition-all duration-500"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercent * 0.88} 88`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-background">
          <RoundTimer
            formattedTime={roundTimer.formattedTime}
            isRunning={roundTimer.isRunning}
            round={currentRound}
          />

          {(phase === "timing" || phase === "ready") && (
            <ComboTimer
              formattedTime={comboTimer.formattedTime}
              isRunning={comboTimer.isRunning}
              elapsedSeconds={comboTimer.elapsedSeconds}
              targetSeconds={currentCombo.durationSeconds}
              onStart={phase === "ready" ? handleStartCombo : comboTimer.start}
              onPause={comboTimer.pause}
              onReset={comboTimer.reset}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3">
            {workout.combos.map((combo, index) => {
              const isCompleted = currentRoundMetrics.some((m) => m.comboId === combo.id)
              const isActive = index === currentComboIndex
              const loadMetric = currentRoundMetrics.find((m) => m.comboId === combo.id)

              return (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  index={index}
                  isActive={isActive && (phase === "ready" || phase === "timing")}
                  isCompleted={isCompleted}
                  loadMetrics={loadMetric}
                />
              )
            })}
          </div>
        </div>
      </div>

      {phase === "input" && <LoadInputModal combo={currentCombo} onSave={handleSaveLoad} />}

      {phase === "round-complete" && rounds.length > 0 && (
        <RoundSummary
          roundData={rounds[rounds.length - 1]}
          allRounds={rounds}
          onStartNextRound={handleStartNextRound}
          onFinishWorkout={handleFinishWorkout}
        />
      )}
    </div>
  )
}
