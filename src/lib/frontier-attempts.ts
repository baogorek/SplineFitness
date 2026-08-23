import { FrontierAttempt } from "@/types/frontier"

export function isFrontierAttemptToday(
  attempts: FrontierAttempt[] | undefined,
  today = new Date()
): boolean {
  return attempts?.some((attempt) => isSameLocalDay(attempt.attemptedAt, today)) ?? false
}

export function removeFrontierAttemptsToday(
  attempts: FrontierAttempt[] | undefined,
  today = new Date()
): FrontierAttempt[] {
  return attempts?.filter((attempt) => !isSameLocalDay(attempt.attemptedAt, today)) ?? []
}

function isSameLocalDay(timestamp: string, date: Date): boolean {
  const candidate = new Date(timestamp)
  if (Number.isNaN(candidate.getTime())) return false

  return candidate.getFullYear() === date.getFullYear()
    && candidate.getMonth() === date.getMonth()
    && candidate.getDate() === date.getDate()
}
