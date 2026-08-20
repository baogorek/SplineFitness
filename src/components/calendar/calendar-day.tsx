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
  const freeformWorkouts = workouts.filter((w) => w.session.mode === "freeform" || w.session.mode === "traditional" as string)
  const archivedProgramWorkouts = workouts.filter((w) => w.session.mode === "coached")
  const intervalWorkouts = workouts.filter((w) => w.session.mode === "interval")
  const sitWorkouts = workouts.filter((w) => w.session.mode === "sit")
  const lissCoreWorkouts = workouts.filter((w) => w.session.mode === "liss-core")
  const vo2MaxWorkouts = workouts.filter((w) => w.session.mode === "vo2max")

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasWorkouts}
      aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${hasWorkouts ? `, ${workouts.length} workout${workouts.length === 1 ? "" : "s"}` : ", no workouts"}`}
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
        <div className="flex gap-1 mt-1" aria-hidden="true">
          {circuitWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-primary" />
          )}
          {freeformWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-blue-500" />
          )}
          {archivedProgramWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-slate-400" />
          )}
          {intervalWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-red-500" />
          )}
          {sitWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-green-500" />
          )}
          {lissCoreWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-violet-500" />
          )}
          {vo2MaxWorkouts.length > 0 && (
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
          )}
        </div>
      )}
    </button>
  )
}
