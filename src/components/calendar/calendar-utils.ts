import { WorkoutHistoryEntry } from "@/types/workout"

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days: CalendarDay[] = []

  // Previous month padding
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false })
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true })
  }

  // Next month padding (fill to 42 for 6 rows)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
  }

  return days
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function groupWorkoutsByDate(
  entries: WorkoutHistoryEntry[]
): Map<string, WorkoutHistoryEntry[]> {
  const map = new Map<string, WorkoutHistoryEntry[]>()
  for (const entry of entries) {
    const localDate = new Date(entry.completedAt)
    const dateKey = formatDateKey(localDate)
    const existing = map.get(dateKey) || []
    map.set(dateKey, [...existing, entry])
  }
  return map
}
