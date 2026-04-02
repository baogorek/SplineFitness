"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Clock, Plus, CheckCircle2, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreeformExercise, FreeformWorkoutSession, FreeformSessionProgress } from "@/types/workout"
import { FreeformExerciseCard } from "./freeform-exercise-card"
import { useTimer } from "@/hooks/use-timer"
import { saveWorkoutSession, saveFreeformProgress, getFreeformProgress, clearFreeformProgress } from "@/lib/storage"

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

type FreeformPhase = "workout" | "resume-prompt"

export function FreeformWorkout({ onModeChange }: FreeformWorkoutProps) {
  const [exercises, setExercises] = useState<FreeformExercise[]>([createEmptyExercise()])
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<FreeformPhase>("workout")
  const [pendingResume, setPendingResume] = useState<FreeformSessionProgress | null>(null)
  const startedAtRef = useRef(new Date().toISOString())
  const timer = useTimer({ countUp: true })

  useEffect(() => {
    const saved = getFreeformProgress()
    if (saved) {
      setPendingResume(saved)
      setPhase("resume-prompt")
    } else {
      timer.start()
    }
  }, [])

  useEffect(() => {
    if (phase !== "workout") return
    saveFreeformProgress({
      exercises,
      elapsedSeconds: timer.elapsedSeconds,
      startedAt: startedAtRef.current,
      savedAt: new Date().toISOString(),
    })
  }, [phase, exercises, timer.elapsedSeconds])

  const handleResume = useCallback(() => {
    if (!pendingResume) return
    setExercises(pendingResume.exercises)
    startedAtRef.current = pendingResume.startedAt
    timer.resetTo(pendingResume.elapsedSeconds)
    timer.start()
    setPendingResume(null)
    setPhase("workout")
  }, [pendingResume, timer])

  const handleDiscardResume = useCallback(() => {
    clearFreeformProgress()
    setPendingResume(null)
    setPhase("workout")
    timer.start()
  }, [timer])

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
    clearFreeformProgress()
    setSaving(false)
    onModeChange()
  }

  const handleBack = () => {
    clearFreeformProgress()
    onModeChange()
  }

  if (phase === "resume-prompt" && pendingResume) {
    const namedCount = pendingResume.exercises.filter((e) => e.name.trim()).length
    const savedTime = new Date(pendingResume.savedAt)
    const timeAgo = Math.round((Date.now() - savedTime.getTime()) / 60000)
    const timeAgoText = timeAgo < 1 ? "just now" : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume Workout?</h1>
          <p className="text-muted-foreground">
            You have an in-progress Freeform session from {timeAgoText}.
          </p>
          <div className="rounded-lg bg-muted/50 p-4 text-left space-y-1">
            <p className="text-sm text-foreground">
              {namedCount} exercise{namedCount !== 1 ? "s" : ""} logged
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleResume}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors w-full"
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

  const hasNamedExercises = exercises.some((e) => e.name.trim())

  return (
    <div className="flex min-h-screen flex-col pb-32">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack} className="gap-1">
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
