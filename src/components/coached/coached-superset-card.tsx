"use client"

import { CoachedSuperset } from "@/types/workout"
import { CoachedExerciseItem } from "./coached-exercise-item"

interface CoachedSupersetCardProps {
  superset: CoachedSuperset
  completedExercises: Set<string>
  onToggleDone: (id: string) => void
}

export function CoachedSupersetCard({ superset, completedExercises, onToggleDone }: CoachedSupersetCardProps) {
  const restLabel = superset.restBetweenRoundsSeconds
    ? `${superset.restBetweenRoundsSeconds}s rest between rounds`
    : null

  return (
    <div className="border-l-4 border-purple-400 pl-3 py-1 my-2">
      <p className="text-sm font-semibold text-foreground">{superset.label}</p>
      {superset.instruction && (
        <p className="text-xs text-muted-foreground mt-0.5">{superset.instruction}</p>
      )}
      <div className="divide-y divide-border">
        {superset.exercises.map((ex, i) => {
          const letter = String.fromCharCode(65 + i)
          return (
            <CoachedExerciseItem
              key={ex.id}
              exercise={ex}
              index={i}
              labelPrefix={superset.exercises.length > 1 ? `${letter}.` : undefined}
              isDone={completedExercises.has(ex.id)}
              onToggleDone={onToggleDone}
            />
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span>{superset.rounds} round{superset.rounds !== 1 ? "s" : ""}</span>
        {restLabel && <span>{restLabel}</span>}
      </div>
    </div>
  )
}
