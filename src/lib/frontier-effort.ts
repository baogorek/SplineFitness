import { getFrontierTimerTarget, parseCustomTimedMark } from "@/lib/frontier-timer"
import { formatDuration, getCurrentFrontierChange, isFrontierImprovement } from "@/lib/frontier-utils"
import { FrontierAttempt, FrontierCard, FrontierChange, FrontierExercise } from "@/types/frontier"

export type FrontierTimerProposal = Pick<FrontierChange, "value" | "rawValue">

export function getFrontierTimerProposal(
  exercise: FrontierExercise,
  elapsedSeconds: number,
  weight?: number,
): FrontierTimerProposal | null {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return null
  const current = getCurrentFrontierChange(exercise.metric, exercise.changes)
  const currentSeconds = getFrontierTimerTarget(exercise)
  const improvementSeconds = currentSeconds === null ? null : exercise.metric === "duration-faster"
    ? currentSeconds - elapsedSeconds : elapsedSeconds - currentSeconds
  // Test the real effort BEFORE rounding: 1:44.9 does not beat 1:30 by 15 seconds.
  if (improvementSeconds !== null && improvementSeconds < 15) return null
  const roundedSeconds = Math.round(elapsedSeconds / 15) * 15
  if (roundedSeconds <= 0) return null

  if (exercise.metric === "freeform") {
    const timedMark = parseCustomTimedMark(current?.rawValue)
    return timedMark && roundedSeconds > timedMark.seconds
      ? { rawValue: `${timedMark.prefix}${formatDuration(roundedSeconds)}` } : null
  }
  if (exercise.metric === "weight-time") {
    if (weight === undefined || !Number.isFinite(weight) || weight <= 0) return null
    const value = { primary: weight, secondary: roundedSeconds }
    return isFrontierImprovement(exercise.metric, current?.value ?? null, value) ? { value } : null
  }
  if (exercise.metric === "duration-longer" || exercise.metric === "duration-faster") {
    const value = { primary: roundedSeconds }
    return isFrontierImprovement(exercise.metric, current?.value ?? null, value) ? { value } : null
  }
  return null
}

/** Resolve by stable IDs, merge with the latest card, and make retries idempotent. */
export function recordFrontierTimerEffort(
  cards: FrontierCard[],
  cardId: string,
  exerciseId: string,
  attempt: FrontierAttempt,
  update?: { baseline: FrontierExercise; proposal: FrontierTimerProposal },
): FrontierCard[] {
  const card = cards.find((item) => item.id === cardId)
  const exercise = card?.exercises.find((item) => item.id === exerciseId)
  if (!card || !exercise) throw new Error("This exercise was removed. Its timer result could not be saved.")
  if (attempt.source !== "timer" || !attempt.elapsedSeconds || !Number.isFinite(attempt.elapsedSeconds) || attempt.elapsedSeconds <= 0) {
    throw new Error("There is no completed effort to save.")
  }
  let changes = exercise.changes
  const alreadyUpdated = [exercise, ...(exercise.metricHistory ?? [])].some((history) => (
    history.changes.some((change) => change.attemptId === attempt.id)
  ))
  if (update && !alreadyUpdated) {
    const baselineMark = getCurrentFrontierChange(update.baseline.metric, update.baseline.changes)
    const currentMark = getCurrentFrontierChange(exercise.metric, exercise.changes)
    if (exercise.metric !== update.baseline.metric || currentMark?.id !== baselineMark?.id) {
      throw new Error("The frontier changed during this effort. Your attempt is recorded; review the current mark in the editor.")
    }
    const proposal = getFrontierTimerProposal(exercise, attempt.elapsedSeconds, attempt.weight)
    if (!proposal || JSON.stringify(proposal) !== JSON.stringify(update.proposal)) {
      throw new Error("This effort does not qualify for the proposed frontier update.")
    }
    changes = [...changes, {
      id: `${attempt.id}-frontier`, attemptId: attempt.id,
      ...proposal, recordedAt: attempt.attemptedAt, kind: "progress",
    }]
  }
  const alreadyRecorded = [exercise, ...(exercise.metricHistory ?? [])].some((history) => (
    history.attempts?.some((item) => item.id === attempt.id)
  ))
  const updated: FrontierExercise = {
    ...exercise, changes,
    attempts: alreadyRecorded ? exercise.attempts ?? [] : [...(exercise.attempts ?? []), attempt],
    updatedAt: new Date().toISOString(),
  }
  return cards.map((item) => item.id === cardId ? {
    ...card,
    exercises: card.exercises.map((item) => item.id === exerciseId ? updated : item),
    updatedAt: updated.updatedAt,
  } : item)
}
