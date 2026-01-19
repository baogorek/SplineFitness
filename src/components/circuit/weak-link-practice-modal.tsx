"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Target, Play, SkipForward } from "lucide-react"
import { WeakLinkEntry } from "@/types/workout"

const PRACTICE_DURATIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
  { value: 120, label: "2m" },
]

interface WeakLinkPracticeModalProps {
  weakLinks: WeakLinkEntry[]
  onStartPractice: (exercises: WeakLinkEntry[], durationSeconds: number) => void
  onSkip: () => void
}

export function WeakLinkPracticeModal({
  weakLinks,
  onStartPractice,
  onSkip,
}: WeakLinkPracticeModalProps) {
  const uniqueExercises = useMemo(() => {
    const seen = new Map<string, WeakLinkEntry & { count: number }>()
    weakLinks.forEach((wl) => {
      if (seen.has(wl.exerciseId)) {
        seen.get(wl.exerciseId)!.count++
      } else {
        seen.set(wl.exerciseId, { ...wl, count: 1 })
      }
    })
    return Array.from(seen.values())
  }, [weakLinks])

  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(
    () => new Set(uniqueExercises.map((e) => e.exerciseId))
  )
  const [duration, setDuration] = useState(60)

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })
  }

  const handleStartPractice = () => {
    const selected = uniqueExercises.filter((e) =>
      selectedExercises.has(e.exerciseId)
    )
    onStartPractice(selected, duration)
  }

  if (uniqueExercises.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Weak Link Practice
              </h2>
              <p className="text-sm text-muted-foreground">
                Work on exercises that challenged you
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Select exercises to practice:
            </p>
            <div className="space-y-2">
              {uniqueExercises.map((exercise) => (
                <button
                  key={exercise.exerciseId}
                  onClick={() => toggleExercise(exercise.exerciseId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                    selectedExercises.has(exercise.exerciseId)
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border hover:border-amber-500/50"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedExercises.has(exercise.exerciseId)
                        ? "border-amber-500 bg-amber-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedExercises.has(exercise.exerciseId) && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-sm ${
                        selectedExercises.has(exercise.exerciseId)
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {exercise.exerciseName}
                    </span>
                  </div>
                  {exercise.count > 1 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {exercise.count}x
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Practice time per exercise:
            </p>
            <div className="flex gap-2">
              {PRACTICE_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    duration === d.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onSkip}
              className="h-12"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>
            <Button
              onClick={handleStartPractice}
              disabled={selectedExercises.size === 0}
              className="h-12"
            >
              <Play className="mr-2 h-4 w-4" />
              Practice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
