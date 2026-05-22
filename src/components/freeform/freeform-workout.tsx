"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Calendar, Clock, Plus, CheckCircle2, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FreeformExercise, FreeformWorkoutSession, FreeformSessionProgress } from "@/types/workout"
import { FreeformExerciseCard } from "./freeform-exercise-card"
import { useTimer } from "@/hooks/use-timer"
import { saveWorkoutSession, saveFreeformProgress, getFreeformProgress, clearFreeformProgress } from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"

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

type FreeformPhase = "workout" | "resume-prompt" | "complete"

function formatSavedAtLabel(savedAt: string): string {
  return new Date(savedAt).toLocaleString()
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function getSessionDurationSeconds(session: FreeformWorkoutSession): number {
  const completedAt = session.completedAt || session.startedAt
  return Math.max(
    0,
    Math.round((new Date(completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
  )
}

function formatSetForCalendar(set: FreeformExercise["sets"][number]): string {
  const parts = []
  if (set.weight) {
    parts.push(`${set.weight} lbs`)
  }
  if (set.reps) {
    parts.push(`${set.reps} reps`)
  }
  return parts.length > 0 ? `Set ${set.id} (${parts.join(", ")})` : `Set ${set.id}`
}

function formatExerciseForCalendar(exercise: FreeformExercise): string {
  const tags = exercise.tags.length > 0 ? ` [${exercise.tags.join(", ")}]` : ""
  if (exercise.sets.length === 0) {
    return `${exercise.name}${tags}`
  }
  return `${exercise.name}${tags}: ${exercise.sets.map(formatSetForCalendar).join("; ")}`
}

function buildGoogleCalendarUrl(session: FreeformWorkoutSession): string {
  const toCalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+Z/, "Z")
  const duration = formatDuration(getSessionDurationSeconds(session))
  const lines = [
    `Duration: ${duration}`,
    `Exercises: ${session.exercises.length}`,
    "",
    "Exercise Log:",
    ...session.exercises.map((exercise) => `  ${formatExerciseForCalendar(exercise)}`),
  ]

  let details = lines.join("\n")
  if (details.length > 1500) {
    details = details.slice(0, 1497) + "..."
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Freeform Workout",
    dates: `${toCalDate(session.startedAt)}/${toCalDate(session.completedAt || session.startedAt)}`,
    details,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function FreeformWorkout({ onModeChange }: FreeformWorkoutProps) {
  const [initialResume] = useState<FreeformSessionProgress | null>(() => getFreeformProgress())
  const [exercises, setExercises] = useState<FreeformExercise[]>([createEmptyExercise()])
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<FreeformPhase>(() => initialResume ? "resume-prompt" : "workout")
  const [pendingResume, setPendingResume] = useState<FreeformSessionProgress | null>(() => initialResume)
  const [completedSessionData, setCompletedSessionData] = useState<FreeformWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const startedAtRef = useRef(new Date().toISOString())
  const savingRef = useRef(false)
  const timer = useTimer({ countUp: true })
  const startTimer = timer.start
  const { signInWithGoogle } = useAuth()

  useEffect(() => {
    if (phase === "workout" && !pendingResume) {
      startTimer()
    }
  }, [phase, pendingResume, startTimer])

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
    if (savingRef.current) return

    const namedExercises = exercises.filter((e) => e.name.trim())
    if (namedExercises.length === 0) return

    savingRef.current = true
    setSaving(true)
    timer.pause()

    const completedAt = new Date().toISOString()
    const session: FreeformWorkoutSession = {
      mode: "freeform",
      startedAt: startedAtRef.current,
      completedAt,
      exercises: namedExercises,
    }
    clearFreeformProgress()
    setCompletedSessionData(session)

    if (FEATURES.AUTH_ENABLED) {
      const result = await saveWorkoutSession(session)
      setSavedToHistory(result !== null)
    }

    setSaving(false)
    setPhase("complete")
  }

  const handleBack = () => {
    clearFreeformProgress()
    onModeChange()
  }

  if (phase === "resume-prompt" && pendingResume) {
    const namedCount = pendingResume.exercises.filter((e) => e.name.trim()).length
    const savedAtLabel = formatSavedAtLabel(pendingResume.savedAt)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume Workout?</h1>
          <p className="text-muted-foreground">
            You have an in-progress Freeform session saved at {savedAtLabel}.
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

  if (phase === "complete" && completedSessionData) {
    const durationSeconds = getSessionDurationSeconds(completedSessionData)
    const totalSets = completedSessionData.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
          <p className="text-muted-foreground">
            You logged {completedSessionData.exercises.length} exercise
            {completedSessionData.exercises.length !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Time
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {formatDuration(durationSeconds)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Sets
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">{totalSets}</p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-left space-y-3">
            {completedSessionData.exercises.map((exercise) => (
              <div key={exercise.id} className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{exercise.name}</p>
                {exercise.sets.length > 0 && (
                  <div className="space-y-0.5">
                    {exercise.sets.map((set) => (
                      <p key={set.id} className="text-xs text-muted-foreground font-mono">
                        {formatSetForCalendar(set)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

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

          {FEATURES.AUTH_ENABLED ? (
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
          ) : (
            <div className="rounded-lg bg-slate-100 border border-slate-200 p-4 mt-4 text-left">
              <p className="text-sm font-medium text-slate-700 mb-2">Workout Data</p>
              <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {JSON.stringify(completedSessionData, null, 2)}
              </pre>
            </div>
          )}

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
