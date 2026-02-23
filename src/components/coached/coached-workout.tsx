"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { CoachedWorkoutDefinition, CoachedWorkoutSession } from "@/types/workout"
import { COACHED_WORKOUTS } from "@/data/coached-workouts"
import { saveWorkoutSession, formatTime } from "@/lib/storage"
import { CoachedPhaseCard } from "./coached-phase-card"
import { CoachedCompletion } from "./coached-completion"

type Phase = "select" | "active" | "complete"

interface CoachedWorkoutProps {
  onModeChange: () => void
}

function WorkoutSelector({ onSelect, onBack }: { onSelect: (w: CoachedWorkoutDefinition) => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Coached Lifting</h1>
      </header>
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">Choose a workout program:</p>
        {COACHED_WORKOUTS.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w)}
            className="w-full rounded-xl border-2 border-purple-200 hover:border-purple-400 bg-card p-5 text-left transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">{w.shortName}</h2>
                <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
                <p className="text-xs text-purple-500 font-medium mt-2">{w.phases.length} phases</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function CoachedWorkout({ onModeChange }: CoachedWorkoutProps) {
  const [phase, setPhase] = useState<Phase>("select")
  const [workout, setWorkout] = useState<CoachedWorkoutDefinition | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set())
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
  const [startedAt, setStartedAt] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedSession, setCompletedSession] = useState<CoachedWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startWorkout = (w: CoachedWorkoutDefinition) => {
    setWorkout(w)
    setPhase("active")
    setStartedAt(new Date().toISOString())
    setExpandedPhase(w.phases[0].id)
    setCompletedPhases(new Set())
    setCompletedExercises(new Set())
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
  }

  const toggleExercise = useCallback((exerciseId: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })
  }, [])

  const markPhaseDone = useCallback((phaseId: string) => {
    if (!workout) return
    setCompletedPhases((prev) => {
      const next = new Set(prev)
      next.add(phaseId)

      // Mark all exercises in this phase as done too
      const p = workout.phases.find((ph) => ph.id === phaseId)
      if (p) {
        setCompletedExercises((prevEx) => {
          const nextEx = new Set(prevEx)
          for (const item of p.items) {
            if (item.type === "exercise") {
              nextEx.add(item.exercise.id)
            } else {
              for (const ex of item.superset.exercises) {
                nextEx.add(ex.id)
              }
            }
          }
          return nextEx
        })
      }

      const allDone = workout.phases.every((ph) => next.has(ph.id))
      if (allDone) {
        if (timerRef.current) clearInterval(timerRef.current)
        const now = new Date().toISOString()
        const session: CoachedWorkoutSession = {
          mode: "coached",
          workoutId: workout.id,
          workoutName: workout.shortName,
          startedAt,
          completedAt: now,
          totalTimeSeconds: elapsedSeconds,
          phasesCompleted: Array.from(next),
        }
        setCompletedSession(session)
        setPhase("complete")
        saveWorkoutSession(session).then((entry) => {
          if (entry) setSavedToHistory(true)
        })
      } else {
        const currentIndex = workout.phases.findIndex((ph) => ph.id === phaseId)
        const nextPhase = workout.phases.find((ph, i) => i > currentIndex && !next.has(ph.id))
        if (nextPhase) {
          setExpandedPhase(nextPhase.id)
          setTimeout(() => {
            phaseRefs.current[nextPhase.id]?.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 100)
        }
      }

      return next
    })
  }, [workout, startedAt, elapsedSeconds])

  if (phase === "complete" && completedSession) {
    return (
      <CoachedCompletion
        session={completedSession}
        savedToHistory={savedToHistory}
        onBack={onModeChange}
      />
    )
  }

  if (phase === "select" || !workout) {
    return <WorkoutSelector onSelect={startWorkout} onBack={onModeChange} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur">
        <button onClick={onModeChange} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate">{workout.shortName}</h1>
          <p className="text-xs text-muted-foreground">{completedPhases.size}/{workout.phases.length} phases</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
        </div>
      </header>

      <div className="p-4 space-y-3 max-w-lg mx-auto pb-8">
        {workout.phases.map((p) => (
          <div key={p.id} ref={(el) => { phaseRefs.current[p.id] = el }}>
            <CoachedPhaseCard
              phase={p}
              isExpanded={expandedPhase === p.id}
              isDone={completedPhases.has(p.id)}
              completedExercises={completedExercises}
              onToggleExercise={toggleExercise}
              onToggle={() => setExpandedPhase(expandedPhase === p.id ? null : p.id)}
              onMarkDone={() => markPhaseDone(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
