"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Clock, Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreeformExercise, FreeformWorkoutSession } from "@/types/workout"
import { FreeformExerciseCard } from "./freeform-exercise-card"
import { useTimer } from "@/hooks/use-timer"
import { saveWorkoutSession } from "@/lib/storage"

interface FreeformWorkoutProps {
  onModeChange: () => void
}

function createEmptyExercise(): FreeformExercise {
  return {
    id: crypto.randomUUID(),
    name: "",
    tags: [],
    sets: [],
  }
}

export function FreeformWorkout({ onModeChange }: FreeformWorkoutProps) {
  const [exercises, setExercises] = useState<FreeformExercise[]>([createEmptyExercise()])
  const [saving, setSaving] = useState(false)
  const startedAtRef = useRef(new Date().toISOString())
  const timer = useTimer({ countUp: true })

  useEffect(() => {
    timer.start()
  }, [])

  const updateExercise = (id: string, updated: FreeformExercise) => {
    setExercises((prev) => prev.map((e) => (e.id === id ? updated : e)))
  }

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }

  const addExercise = () => {
    setExercises((prev) => [...prev, createEmptyExercise()])
  }

  const handleComplete = async () => {
    const namedExercises = exercises.filter((e) => e.name.trim())
    if (namedExercises.length === 0) return

    setSaving(true)
    const session: FreeformWorkoutSession = {
      mode: "freeform",
      startedAt: startedAtRef.current,
      completedAt: new Date().toISOString(),
      exercises: namedExercises,
    }
    await saveWorkoutSession(session)
    setSaving(false)
    onModeChange()
  }

  const hasNamedExercises = exercises.some((e) => e.name.trim())

  return (
    <div className="flex min-h-screen flex-col pb-32">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onModeChange} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-semibold tracking-tight text-foreground">FREEFORM</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">{timer.formattedTime}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-4">
        {exercises.map((exercise) => (
          <FreeformExerciseCard
            key={exercise.id}
            exercise={exercise}
            onUpdate={(updated) => updateExercise(exercise.id, updated)}
            onRemove={() => removeExercise(exercise.id)}
          />
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-4">
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={addExercise}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
          <Button
            size="lg"
            className="w-full h-12 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!hasNamedExercises || saving}
            onClick={handleComplete}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {saving ? "Saving..." : "Complete Workout"}
          </Button>
        </div>
      </footer>
    </div>
  )
}
