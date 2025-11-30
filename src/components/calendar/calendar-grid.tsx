"use client"

import { WorkoutHistoryEntry } from "@/types/workout"
import { getCalendarDays, formatDateKey } from "./calendar-utils"
import { CalendarDay } from "./calendar-day"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarGridProps {
  currentMonth: Date
  workoutsByDate: Map<string, WorkoutHistoryEntry[]>
  onDayClick: (date: Date, workouts: WorkoutHistoryEntry[]) => void
}

export function CalendarGrid({ currentMonth, workoutsByDate, onDayClick }: CalendarGridProps) {
  const days = getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth())

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dateKey = formatDateKey(day.date)
          const workouts = workoutsByDate.get(dateKey) || []

          return (
            <CalendarDay
              key={index}
              date={day.date}
              workouts={workouts}
              isCurrentMonth={day.isCurrentMonth}
              onClick={() => onDayClick(day.date, workouts)}
            />
          )
        })}
      </div>
    </div>
  )
}
