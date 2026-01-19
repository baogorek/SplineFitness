"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Play, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  CircuitWorkoutDefinition,
  ExerciseSetting,
  ExerciseVariation,
  WorkoutVariant,
} from "@/types/workout"
import { circuitWorkouts } from "@/data/circuit-workouts"
import { AttributionBanner } from "./attribution-banner"
import { DurationSelector, GlobalDurationControl } from "./duration-selector"

interface CircuitSetupProps {
  onBack: () => void
  onStart: (
    variant: WorkoutVariant,
    exerciseSettings: Record<string, ExerciseSetting>
  ) => void
  initialVariant?: WorkoutVariant
  savedSettings?: Record<string, ExerciseSetting>
}

export function CircuitSetup({
  onBack,
  onStart,
  initialVariant = "A",
  savedSettings,
}: CircuitSetupProps) {
  const [variant, setVariant] = useState<WorkoutVariant>(initialVariant)
  const [exerciseSettings, setExerciseSettings] = useState<
    Record<string, ExerciseSetting>
  >({})
  const [expandedCombos, setExpandedCombos] = useState<Set<string>>(new Set())

  const workout = circuitWorkouts[variant]

  useEffect(() => {
    const allExercises: Record<string, ExerciseSetting> = {}
    Object.values(circuitWorkouts).forEach((w) => {
      w.combos.forEach((combo) => {
        combo.subExercises.forEach((sub) => {
          allExercises[sub.id] = savedSettings?.[sub.id] || {
            durationSeconds: 60,
            variation: "standard" as ExerciseVariation,
          }
        })
      })
    })
    setExerciseSettings(allExercises)
  }, [savedSettings])

  const handleDurationChange = (exerciseId: string, duration: number) => {
    setExerciseSettings((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        durationSeconds: duration,
      },
    }))
  }

  const handleSetAllDurations = (seconds: number) => {
    setExerciseSettings((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((key) => {
        updated[key] = { ...updated[key], durationSeconds: seconds }
      })
      return updated
    })
  }

  const toggleCombo = (comboId: string) => {
    setExpandedCombos((prev) => {
      const next = new Set(prev)
      if (next.has(comboId)) {
        next.delete(comboId)
      } else {
        next.add(comboId)
      }
      return next
    })
  }

  const totalTimeSeconds = useMemo(() => {
    return workout.combos.reduce((total, combo) => {
      const comboDuration = combo.subExercises.reduce((sum, sub) => {
        return sum + (exerciseSettings[sub.id]?.durationSeconds || 60)
      }, 0)
      return total + comboDuration
    }, 0)
  }, [workout.combos, exerciseSettings])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:00`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              CIRCUIT SETUP
            </span>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AttributionBanner />

        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setVariant("A")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              variant === "A"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Workout A
          </button>
          <button
            onClick={() => setVariant("B")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              variant === "B"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Workout B
          </button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Exercise Timing
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(totalTimeSeconds)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <GlobalDurationControl onSetAll={handleSetAllDurations} />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {workout.combos.map((combo, comboIndex) => {
            const isExpanded = expandedCombos.has(combo.id)
            const comboDuration = combo.subExercises.reduce(
              (sum, sub) => sum + (exerciseSettings[sub.id]?.durationSeconds || 60),
              0
            )

            return (
              <Card key={combo.id}>
                <button
                  onClick={() => toggleCombo(combo.id)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {comboIndex + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground">
                          {combo.category}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatTime(comboDuration)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2 pt-2 border-t border-border">
                      {combo.subExercises.map((sub, subIndex) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-sm text-foreground">
                            {subIndex + 1}. {sub.name}
                          </span>
                          <DurationSelector
                            value={exerciseSettings[sub.id]?.durationSeconds || 60}
                            onChange={(v) => handleDurationChange(sub.id, v)}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4">
        <Button
          onClick={() => onStart(variant, exerciseSettings)}
          className="w-full h-14 text-lg font-semibold"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Workout
        </Button>
      </div>
    </div>
  )
}
