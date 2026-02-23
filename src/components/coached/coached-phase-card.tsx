"use client"

import { useMemo } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { CoachedPhase } from "@/types/workout"
import { CoachedExerciseItem } from "./coached-exercise-item"
import { CoachedSupersetCard } from "./coached-superset-card"

interface CoachedPhaseCardProps {
  phase: CoachedPhase
  isExpanded: boolean
  isDone: boolean
  completedExercises: Set<string>
  onToggleExercise: (id: string) => void
  onToggle: () => void
  onMarkDone: () => void
}

function getAllExerciseIds(phase: CoachedPhase): string[] {
  const ids: string[] = []
  for (const item of phase.items) {
    if (item.type === "exercise") {
      ids.push(item.exercise.id)
    } else {
      for (const ex of item.superset.exercises) {
        ids.push(ex.id)
      }
    }
  }
  return ids
}

export function CoachedPhaseCard({ phase, isExpanded, isDone, completedExercises, onToggleExercise, onToggle, onMarkDone }: CoachedPhaseCardProps) {
  const allIds = useMemo(() => getAllExerciseIds(phase), [phase])
  const doneCount = allIds.filter((id) => completedExercises.has(id)).length
  const allExercisesDone = doneCount === allIds.length && allIds.length > 0

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
          isDone
            ? "bg-green-500 text-white"
            : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
        }`}>
          {isDone ? <Check className="h-4 w-4" /> : phase.phaseNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {phase.name}
          </p>
          {!isExpanded && !isDone && allIds.length > 0 && (
            <p className="text-xs text-muted-foreground">{doneCount}/{allIds.length} exercises</p>
          )}
          {!isExpanded && isDone && (
            <p className="text-xs text-green-600">Complete</p>
          )}
          {phase.description && !isExpanded && !isDone && doneCount === 0 && (
            <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {phase.description && (
            <p className="text-xs text-muted-foreground mb-3 italic">{phase.description}</p>
          )}

          {!isDone && allIds.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{doneCount}/{allIds.length} done</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${(doneCount / allIds.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            {phase.items.map((item) => {
              if (item.type === "exercise") {
                return (
                  <CoachedExerciseItem
                    key={item.exercise.id}
                    exercise={item.exercise}
                    isDone={completedExercises.has(item.exercise.id)}
                    onToggleDone={onToggleExercise}
                  />
                )
              }
              return (
                <CoachedSupersetCard
                  key={item.superset.id}
                  superset={item.superset}
                  completedExercises={completedExercises}
                  onToggleDone={onToggleExercise}
                />
              )
            })}
          </div>

          {!isDone && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkDone()
              }}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                allExercisesDone
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
              }`}
            >
              <Check className="h-4 w-4" />
              {allExercisesDone ? "Phase Complete — Next" : "Mark Phase Done"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
