import { FrontierAttempt, FrontierCard, FrontierExercise } from "@/types/frontier"

/** Changes to metadata, corrections, and imports do not establish an effort date. */
export function getFrontierLastTried(exercise: FrontierExercise): string | null {
  const histories = [exercise, ...(exercise.metricHistory ?? [])]
  const dates = histories.flatMap((history) => [
    ...(history.attempts ?? []).map((attempt) => attempt.attemptedAt),
    ...history.changes.filter((change) => change.kind === "progress").map((change) => change.recordedAt),
  ]).filter((date): date is string => Boolean(date && Number.isFinite(Date.parse(date))))
  return dates.reduce<string | null>((latest, date) => (
    !latest || Date.parse(date) > Date.parse(latest) ? date : latest
  ), null)
}

export function getLeastRecentlyTried(cards: FrontierCard[]) {
  return cards.flatMap((card) => card.exercises.map((exercise) => ({
    card, exercise, lastTried: getFrontierLastTried(exercise),
  }))).sort((a, b) => (
    (a.lastTried ? Date.parse(a.lastTried) : -Infinity)
      - (b.lastTried ? Date.parse(b.lastTried) : -Infinity)
    || a.exercise.name.localeCompare(b.exercise.name)
    || a.card.name.localeCompare(b.card.name)
  ))
}

export function formatFrontierLastTried(timestamp: string | null, today = new Date()): string {
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return "No recorded attempts"
  const date = new Date(timestamp)
  // Count calendar days, including across daylight-saving changes.
  const dayNumber = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000
  const days = Math.max(0, dayNumber(today) - dayNumber(date))
  return days === 0 ? "Tried today" : days === 1 ? "Last tried yesterday" : `Last tried ${days} days ago`
}

export function hasFrontierEffortToday(exercise: FrontierExercise, today = new Date()): boolean {
  const latest = getFrontierLastTried(exercise)
  return latest !== null && isSameLocalDay(latest, today)
}

/** Manual toggles must never erase timed results or recorded frontier improvements. */
export function hasAutomaticFrontierEffortToday(exercise: FrontierExercise, today = new Date()): boolean {
  return [exercise, ...(exercise.metricHistory ?? [])].some((history) => (
    (history.attempts ?? []).some((attempt) => attempt.source === "timer" && isSameLocalDay(attempt.attemptedAt, today))
    || history.changes.some((change) => change.kind === "progress" && change.recordedAt && isSameLocalDay(change.recordedAt, today))
  ))
}

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
  return attempts?.filter((attempt) => attempt.source === "timer" || !isSameLocalDay(attempt.attemptedAt, today)) ?? []
}

function isSameLocalDay(timestamp: string, date: Date): boolean {
  const candidate = new Date(timestamp)
  if (Number.isNaN(candidate.getTime())) return false

  return candidate.getFullYear() === date.getFullYear()
    && candidate.getMonth() === date.getMonth()
    && candidate.getDate() === date.getDate()
}
