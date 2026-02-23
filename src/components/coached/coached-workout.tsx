"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, ChevronRight, Check } from "lucide-react"
import { CoachedWorkoutDefinition, CoachedWorkoutSession } from "@/types/workout"
import { COACHED_WORKOUTS } from "@/data/coached-workouts"
import { saveWorkoutSession, formatTime } from "@/lib/storage"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useAudio } from "@/hooks/use-audio"
import { CoachedActivePhase } from "./coached-active-phase"
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
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const [completedPhaseIds, setCompletedPhaseIds] = useState<Set<string>>(new Set())
  const [startedAt, setStartedAt] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedSession, setCompletedSession] = useState<CoachedWorkoutSession | null>(null)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activePhaseRef = useRef<HTMLDivElement | null>(null)

  const isActive = phase === "active"
  useWakeLock(isActive)
  useNavigationGuard(isActive)

  const { startKeepalive, stopKeepalive } = useAudio()

  useEffect(() => {
    if (isActive) {
      startKeepalive()
      return () => stopKeepalive()
    }
  }, [isActive, startKeepalive, stopKeepalive])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startWorkout = (w: CoachedWorkoutDefinition) => {
    setWorkout(w)
    setPhase("active")
    setStartedAt(new Date().toISOString())
    setActivePhaseIndex(0)
    setCompletedPhaseIds(new Set())
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
  }

  const handlePhaseComplete = useCallback(() => {
    if (!workout) return

    const currentPhase = workout.phases[activePhaseIndex]
    const nextCompleted = new Set(completedPhaseIds)
    nextCompleted.add(currentPhase.id)
    setCompletedPhaseIds(nextCompleted)

    const nextIndex = activePhaseIndex + 1
    if (nextIndex >= workout.phases.length) {
      if (timerRef.current) clearInterval(timerRef.current)
      const now = new Date().toISOString()
      const session: CoachedWorkoutSession = {
        mode: "coached",
        workoutId: workout.id,
        workoutName: workout.shortName,
        startedAt,
        completedAt: now,
        totalTimeSeconds: elapsedSeconds,
        phasesCompleted: Array.from(nextCompleted),
      }
      setCompletedSession(session)
      setPhase("complete")
      saveWorkoutSession(session).then((entry) => {
        if (entry) setSavedToHistory(true)
      })
    } else {
      setActivePhaseIndex(nextIndex)
      setTimeout(() => {
        activePhaseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [workout, activePhaseIndex, completedPhaseIds, startedAt, elapsedSeconds])

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
          <p className="text-xs text-muted-foreground">{completedPhaseIds.size}/{workout.phases.length} phases</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
        </div>
      </header>

      <div className="p-4 space-y-3 max-w-lg mx-auto pb-8">
        {workout.phases.map((p, i) => {
          const isDone = completedPhaseIds.has(p.id)
          const isActivePhase = i === activePhaseIndex

          if (isDone) {
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl bg-green-600/10 border border-green-600/20 px-4 py-3"
              >
                <div className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">
                  Phase {p.phaseNumber}: {p.name}
                </span>
              </div>
            )
          }

          if (isActivePhase) {
            return (
              <div
                key={p.id}
                ref={activePhaseRef}
                className="rounded-xl border-2 border-purple-500 bg-card overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border bg-purple-500/5">
                  <h2 className="text-sm font-bold text-purple-400">
                    Phase {p.phaseNumber}: {p.name}
                  </h2>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  )}
                </div>
                <CoachedActivePhase
                  phase={p}
                  onPhaseComplete={handlePhaseComplete}
                />
              </div>
            )
          }

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border px-4 py-3 opacity-50"
            >
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-muted-foreground">{p.phaseNumber}</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{p.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
