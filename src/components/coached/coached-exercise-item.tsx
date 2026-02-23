"use client"

import { useState } from "react"
import { ExternalLink, ChevronDown, ChevronUp, Circle, CheckCircle2 } from "lucide-react"
import { CoachedExercise } from "@/types/workout"

interface CoachedExerciseItemProps {
  exercise: CoachedExercise
  index?: number
  labelPrefix?: string
  isDone: boolean
  onToggleDone: (id: string) => void
}

function buildPrescription(ex: CoachedExercise): string {
  const parts: string[] = []
  if (ex.sets) parts.push(`${ex.sets} x`)
  if (ex.reps) parts.push(ex.reps)
  if (ex.holdSeconds) parts.push(`(${ex.holdSeconds}s hold)`)
  if (ex.durationSeconds) {
    const mins = Math.floor(ex.durationSeconds / 60)
    const secs = ex.durationSeconds % 60
    if (mins > 0 && secs > 0) parts.push(`${mins}m ${secs}s`)
    else if (mins > 0) parts.push(`${mins} min`)
    else parts.push(`${secs}s`)
  }
  if (ex.perSide) parts.push("per side")
  return parts.join(" ")
}

export function CoachedExerciseItem({ exercise, labelPrefix, isDone, onToggleDone }: CoachedExerciseItemProps) {
  const [expanded, setExpanded] = useState(false)
  const prescription = buildPrescription(exercise)
  const hasDetails = exercise.cue || exercise.why || exercise.note
  const videoUrl = exercise.videos?.[0]?.url

  return (
    <div className={`py-2 transition-opacity ${isDone ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggleDone(exercise.id)}
          className="shrink-0 mt-0.5 p-0.5"
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/40" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {labelPrefix && (
              <span className="text-xs font-bold text-purple-500 uppercase shrink-0">{labelPrefix}</span>
            )}
            <span className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {exercise.name}
            </span>
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                aria-label={`Watch ${exercise.name} demo`}
              >
                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </a>
            )}
          </div>
          {prescription && (
            <p className="text-xs text-muted-foreground mt-0.5">{prescription}</p>
          )}
        </div>
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-muted transition-colors shrink-0 mt-0.5"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
      {expanded && hasDetails && (
        <div className="mt-2 ml-7 space-y-1.5 text-xs">
          {exercise.note && (
            <p className="text-amber-600 dark:text-amber-400 italic">{exercise.note}</p>
          )}
          {exercise.cue && (
            <p className="text-foreground"><span className="font-semibold text-muted-foreground">Cue:</span> {exercise.cue}</p>
          )}
          {exercise.why && (
            <p className="text-muted-foreground"><span className="font-semibold">Why:</span> {exercise.why}</p>
          )}
        </div>
      )}
    </div>
  )
}
