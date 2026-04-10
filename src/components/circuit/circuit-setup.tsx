"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ArrowLeft, Play, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  ExerciseSetting,
  WorkoutVariant,
} from "@/types/workout"
import { circuitWorkouts } from "@/data/circuit-workouts"
import { getExerciseEquipment, saveExerciseEquipment } from "@/lib/storage"
import { AttributionBanner } from "./attribution-banner"
import { DurationSelector, GlobalDurationControl } from "./duration-selector"

const VALID_DURATIONS = [30, 45, 60, 75, 90, 105, 120]
const WEIGHT_OPTIONS = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25]
const LIGHT_WEIGHT_OPTIONS = [2.5, 5, 7.5, 10]
const PLATFORM_OPTIONS = [6, 9, 12, 15, 18, 21, 24]

type EquipmentConfig = {
  label: string
  defaultValue: string
  options: { value: string; label: string }[]
}

const EQUIPMENT_EXERCISES: Record<string, EquipmentConfig> = {
  "alt-single-leg-box-squats": {
    label: "Platform height",
    defaultValue: "12 in",
    options: PLATFORM_OPTIONS.map(h => ({ value: `${h} in`, label: `${h} in` })),
  },
  "one-half-bottomed-out-squats": {
    label: "Add weight",
    defaultValue: "10 lbs",
    options: WEIGHT_OPTIONS.map(w => ({ value: `${w} lbs`, label: `${w} lbs` })),
  },
  "bw-triceps-extensions": {
    label: "Add weight",
    defaultValue: "10 lbs",
    options: WEIGHT_OPTIONS.map(w => ({ value: `${w} lbs`, label: `${w} lbs` })),
  },
  "alt-crossover-step-ups": {
    label: "Platform height",
    defaultValue: "12 in",
    options: PLATFORM_OPTIONS.map(h => ({ value: `${h} in`, label: `${h} in` })),
  },
  "alt-reverse-lunges": {
    label: "Add weight",
    defaultValue: "10 lbs",
    options: WEIGHT_OPTIONS.map(w => ({ value: `${w} lbs`, label: `${w} lbs` })),
  },
  "alt-bw-side-lateral-raises": {
    label: "Add weight",
    defaultValue: "5 lbs",
    options: LIGHT_WEIGHT_OPTIONS.map(w => ({ value: `${w} lbs`, label: `${w} lbs` })),
  },
}

function snapToValidDuration(d: number): number {
  return VALID_DURATIONS.reduce((closest, val) =>
    Math.abs(val - d) < Math.abs(closest - d) ? val : closest
  )
}

interface CompactConfig {
  v: WorkoutVariant
  d: number
  c: Record<string, "alternative">
  e?: Record<string, string>
}

function parseConfig(input: string): CompactConfig | null {
  const trimmed = input.trim()

  const configMatch = trimmed.match(/Config:\s*(\{.*\})/)
  if (configMatch) {
    try {
      const parsed = JSON.parse(configMatch[1])
      if (parsed.v && parsed.d !== undefined) {
        return { v: parsed.v, d: snapToValidDuration(parsed.d), c: parsed.c || {}, e: parsed.e }
      }
    } catch { /* not valid JSON */ }
  }

  try {
    const parsed = JSON.parse(trimmed)

    if (parsed.v && parsed.d !== undefined) {
      return { v: parsed.v, d: snapToValidDuration(parsed.d), c: parsed.c || {}, e: parsed.e }
    }

    if (parsed.mode === "circuit") {
      const durations = Object.values(parsed.exerciseSettings || {}).map(
        (s: unknown) => (s as { durationSeconds: number }).durationSeconds
      )
      const durationCounts = new Map<number, number>()
      durations.forEach((d: number) => durationCounts.set(d, (durationCounts.get(d) || 0) + 1))
      let mostCommon = 60
      let maxCount = 0
      durationCounts.forEach((count, duration) => {
        if (count > maxCount) { maxCount = count; mostCommon = duration }
      })
      const choices: Record<string, "alternative"> = {}
      if (parsed.exerciseChoices) {
        Object.entries(parsed.exerciseChoices).forEach(([id, choice]) => {
          if (choice === "alternative") choices[id] = "alternative"
        })
      }
      return { v: parsed.variant, d: snapToValidDuration(mostCommon), c: choices, e: parsed.exerciseEquipment }
    }
  } catch { /* not valid JSON */ }

  return null
}

interface CircuitSetupProps {
  onBack: () => void
  onStart: (
    variant: WorkoutVariant,
    exerciseSettings: Record<string, ExerciseSetting>,
    exerciseChoices: Record<string, "main" | "alternative">,
    exerciseEquipment: Record<string, string>
  ) => void
  initialVariant?: WorkoutVariant
  savedSettings?: Record<string, ExerciseSetting>
  savedChoices?: Record<string, "main" | "alternative">
}

export function CircuitSetup({
  onBack,
  onStart,
  initialVariant = "A",
  savedSettings,
  savedChoices,
}: CircuitSetupProps) {
  const [variant, setVariant] = useState<WorkoutVariant>(initialVariant)
  const [exerciseSettings, setExerciseSettings] = useState<
    Record<string, ExerciseSetting>
  >({})
  const [exerciseChoices, setExerciseChoices] = useState<
    Record<string, "main" | "alternative">
  >({})
  const [exerciseEquipment, setExerciseEquipment] = useState<Record<string, string>>({})
  const [expandedCombos, setExpandedCombos] = useState<Set<string>>(new Set())
  const [configExpanded, setConfigExpanded] = useState(false)
  const [configText, setConfigText] = useState("")
  const [configStatus, setConfigStatus] = useState<string | null>(null)
  const [configError, setConfigError] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)

  const workout = circuitWorkouts[variant]

  useEffect(() => {
    const allExercises: Record<string, ExerciseSetting> = {}
    const allChoices: Record<string, "main" | "alternative"> = {}
    Object.values(circuitWorkouts).forEach((w) => {
      w.combos.forEach((combo) => {
        combo.subExercises.forEach((sub) => {
          allExercises[sub.id] = savedSettings?.[sub.id] || {
            durationSeconds: 60,
          }
          if (sub.alternative) {
            allChoices[sub.id] = savedChoices?.[sub.id] || sub.defaultChoice || "main"
          }
        })
      })
    })
    setExerciseSettings(allExercises)
    setExerciseChoices(allChoices)
  }, [savedSettings, savedChoices])

  useEffect(() => {
    const stored = getExerciseEquipment()
    let migrated = false
    Object.keys(stored).forEach(key => {
      if (stored[key] && !stored[key].endsWith(" lbs") && !stored[key].endsWith(" in")) {
        stored[key] = "10 lbs"
        migrated = true
      }
    })
    if (!stored["alt-single-leg-box-squats"]) {
      stored["alt-single-leg-box-squats"] = "12 in"
      migrated = true
    }
    if (migrated) saveExerciseEquipment(stored)
    setExerciseEquipment(stored)
  }, [])

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

  const handleApplyConfig = () => {
    const config = parseConfig(configText)
    if (!config) {
      setConfigStatus("Could not parse config")
      setConfigError(true)
      return
    }
    setVariant(config.v)
    handleSetAllDurations(config.d)
    setExerciseChoices(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(key => { updated[key] = "main" })
      Object.entries(config.c).forEach(([id]) => { updated[id] = "alternative" })
      return updated
    })
    if (config.e && Object.keys(config.e).length > 0) {
      setExerciseEquipment(config.e)
      saveExerciseEquipment(config.e)
    }
    setConfigStatus("Config applied!")
    setConfigError(false)
    setTimeout(() => {
      setConfigExpanded(false)
      setConfigStatus(null)
      setConfigText("")
    }, 1500)
  }

  const weightedExercises = useMemo(() => {
    const items: { id: string; name: string; weight: string }[] = []
    workout.combos.forEach(combo => {
      combo.subExercises.forEach(sub => {
        if (exerciseEquipment[sub.id]) {
          const choice = exerciseChoices[sub.id]
          const name = sub.alternative && choice === "alternative" ? sub.alternative.name : sub.name
          items.push({ id: sub.id, name, weight: exerciseEquipment[sub.id] })
        }
      })
    })
    return items
  }, [workout.combos, exerciseEquipment, exerciseChoices])

  const handleStartClick = useCallback(() => {
    if (weightedExercises.length > 0) {
      setShowChecklist(true)
    } else {
      onStart(variant, exerciseSettings, exerciseChoices, exerciseEquipment)
    }
  }, [weightedExercises, variant, exerciseSettings, exerciseChoices, exerciseEquipment, onStart])

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

        <div className="rounded-lg border border-border">
          <button
            onClick={() => setConfigExpanded(!configExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Load Previous Config
            {configExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {configExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <textarea
                value={configText}
                onChange={(e) => { setConfigText(e.target.value); setConfigStatus(null) }}
                placeholder="Paste calendar event text or config JSON..."
                className="w-full h-24 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleApplyConfig}
                  disabled={!configText.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                {configStatus && (
                  <span className={`text-sm font-medium ${configError ? "text-red-500" : "text-green-500"}`}>
                    {configStatus}
                  </span>
                )}
              </div>
            </div>
          )}
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
                      {combo.subExercises.map((sub, subIndex) => {
                        const hasAlt = !!sub.alternative
                        const choice = exerciseChoices[sub.id]
                        const displayName = hasAlt && choice === "alternative"
                          ? sub.alternative!.name
                          : sub.name

                        return (
                          <div key={sub.id} className="space-y-1.5">
                            <div className="flex items-center justify-between py-1">
                              <span className="text-sm text-foreground">
                                {subIndex + 1}. {displayName}
                              </span>
                              <DurationSelector
                                value={exerciseSettings[sub.id]?.durationSeconds || 60}
                                onChange={(v) => handleDurationChange(sub.id, v)}
                                compact
                              />
                            </div>
                            {hasAlt && (
                              <div className="flex rounded-lg bg-muted p-0.5 ml-4">
                                <button
                                  onClick={() => setExerciseChoices((prev) => ({ ...prev, [sub.id]: "main" }))}
                                  className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                    choice === "main"
                                      ? "bg-primary text-primary-foreground shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {sub.name}
                                </button>
                                <button
                                  onClick={() => setExerciseChoices((prev) => ({ ...prev, [sub.id]: "alternative" }))}
                                  className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                    choice === "alternative"
                                      ? "bg-primary text-primary-foreground shadow-sm"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {sub.alternative!.name}
                                </button>
                              </div>
                            )}
                            {EQUIPMENT_EXERCISES[sub.id] && (() => {
                              const config = EQUIPMENT_EXERCISES[sub.id]
                              return (
                                <div className="flex items-center gap-2 ml-4 py-1">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!exerciseEquipment[sub.id]}
                                      onChange={(e) => {
                                        setExerciseEquipment(prev => {
                                          const next = { ...prev }
                                          if (e.target.checked) {
                                            next[sub.id] = config.defaultValue
                                          } else {
                                            delete next[sub.id]
                                          }
                                          saveExerciseEquipment(next)
                                          return next
                                        })
                                      }}
                                      className="h-4 w-4 rounded border-border text-primary accent-primary"
                                    />
                                    <span className="text-xs text-muted-foreground">{config.label}</span>
                                  </label>
                                  {exerciseEquipment[sub.id] && (
                                    <select
                                      value={exerciseEquipment[sub.id]}
                                      onChange={(e) => {
                                        setExerciseEquipment(prev => {
                                          const next = { ...prev, [sub.id]: e.target.value }
                                          saveExerciseEquipment(next)
                                          return next
                                        })
                                      }}
                                      className="h-7 rounded-md border border-border bg-muted/50 px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                      {config.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )
                      })}
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
          onClick={handleStartClick}
          className="w-full h-14 text-lg font-semibold"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Workout
        </Button>
      </div>

      {showChecklist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Equipment Summary</h3>
            <p className="text-sm text-muted-foreground">Here&apos;s what you&apos;ve set up for this workout.</p>
            <div className="space-y-3">
              {weightedExercises.map(item => (
                <div
                  key={item.id}
                  className="w-full flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.weight}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowChecklist(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowChecklist(false)
                  onStart(variant, exerciseSettings, exerciseChoices, exerciseEquipment)
                }}
                className="flex-1"
              >
                Start Workout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
