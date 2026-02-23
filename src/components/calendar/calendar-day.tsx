"use client"

import { WorkoutHistoryEntry } from "@/types/workout"
import { isToday } from "./calendar-utils"

interface CalendarDayProps {
  date: Date
  workouts: WorkoutHistoryEntry[]
  isCurrentMonth: boolean
  onClick: () => void
}

export function CalendarDay({ date, workouts, isCurrentMonth, onClick }: CalendarDayProps) {
  const today = isToday(date)
  const hasWorkouts = workouts.length > 0
  const circuitWorkouts = workouts.filter((w) => w.session.mode === "circuit")
  const traditionalWorkouts = workouts.filter((w) => w.session.mode === "traditional")
  const coachedWorkouts = workouts.filter((w) => w.session.mode === "coached")

  return (
    <button
      onClick={onClick}
      disabled={!hasWorkouts}
      className={`
        relative flex flex-col items-center justify-center p-2 h-14 rounded-lg transition-colors
        ${today ? "ring-2 ring-primary bg-primary/20" : ""}
        ${hasWorkouts ? "bg-muted hover:bg-muted/80 cursor-pointer" : ""}
      `}
    >
      <span className={`text-sm font-medium ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"} ${today ? "text-primary font-bold" : ""}`}>
        {date.getDate()}
      </span>

      {hasWorkouts && (
        <div className="flex gap-1 mt-1">
          {circuitWorkouts.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
          {traditionalWorkouts.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
          {coachedWorkouts.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          )}
        </div>
      )}
    </button>
  )
}
