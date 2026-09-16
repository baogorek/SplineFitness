import { describe, expect, it } from "vitest"
import {
  isFrontierAttemptToday,
  removeFrontierAttemptsToday,
  getFrontierLastTried,
  getLeastRecentlyTried,
  formatFrontierLastTried,
  hasAutomaticFrontierEffortToday,
} from "./frontier-attempts"
import { FrontierAttempt, FrontierCard, FrontierExercise } from "@/types/frontier"

describe("Frontier attempts", () => {
  const today = new Date(2026, 7, 23, 12, 0, 0)
  const todayAttempt: FrontierAttempt = {
    id: "today",
    attemptedAt: new Date(2026, 7, 23, 8, 0, 0).toISOString(),
  }
  const yesterdayAttempt: FrontierAttempt = {
    id: "yesterday",
    attemptedAt: new Date(2026, 7, 22, 20, 0, 0).toISOString(),
  }

  it("recognizes an attempt from the same local calendar day", () => {
    expect(isFrontierAttemptToday([yesterdayAttempt, todayAttempt], today)).toBe(true)
    expect(isFrontierAttemptToday([yesterdayAttempt], today)).toBe(false)
  })

  it("removes only attempts from today when toggled off", () => {
    expect(removeFrontierAttemptsToday([yesterdayAttempt, todayAttempt], today)).toEqual([
      yesterdayAttempt,
    ])
  })

  it("tolerates legacy exercises without attempt history", () => {
    expect(isFrontierAttemptToday(undefined, today)).toBe(false)
    expect(removeFrontierAttemptsToday(undefined, today)).toEqual([])
  })

  it("never removes a timer result when undoing a manual check-in", () => {
    const timed = { ...todayAttempt, id: "timed", source: "timer" as const, elapsedSeconds: 32 }
    expect(removeFrontierAttemptsToday([todayAttempt, yesterdayAttempt, timed], today)).toEqual([yesterdayAttempt, timed])
  })
})

describe("least recently tried", () => {
  const entry: FrontierExercise = { id: "hold", name: "Hold", metric: "duration-longer", changes: [], order: 0, createdAt: "2026-09-15T12:00:00Z", updatedAt: "2026-09-15T12:00:00Z" }
  const old = "2026-08-01T12:00:00Z"
  const recent = "2026-09-14T12:00:00Z"

  it("ignores creation, metadata edits, imports, corrections, and invalid timestamps", () => {
    expect(getFrontierLastTried({ ...entry, changes: [
      { id: "import", kind: "import", recordedAt: recent },
      { id: "correction", kind: "correction", recordedAt: recent },
      { id: "invalid", kind: "progress", recordedAt: "invalid" },
      { id: "undated", kind: "progress" },
    ], attempts: [{ id: "bad", attemptedAt: "invalid" }] })).toBeNull()
  })
  it("uses the latest real attempt or improvement, including previous measurement histories", () => {
    const withHistory: FrontierExercise = { ...entry,
      changes: [{ id: "mark", kind: "progress", recordedAt: old }],
      metricHistory: [{ id: "past", metric: "freeform", changes: [], attempts: [{ id: "attempt", attemptedAt: recent }], endedAt: entry.updatedAt }],
    }
    expect(getFrontierLastTried(withHistory)).toBe(recent)
    expect(getFrontierLastTried({ ...withHistory, attempts: [{ id: "latest", attemptedAt: entry.updatedAt }] })).toBe(entry.updatedAt)
  })
  it("sorts all cards with unrecorded exercises first and oldest efforts next", () => {
    const cards: FrontierCard[] = [
      { id: "gym", name: "Gym", createdAt: "", updatedAt: "", order: 0, exercises: [
        { ...entry, id: "recent", attempts: [{ id: "recent", attemptedAt: recent }] },
        { ...entry, id: "never", name: "Never" },
      ] },
      { id: "home", name: "Home", createdAt: "", updatedAt: "", order: 1, exercises: [
        { ...entry, id: "old", attempts: [{ id: "old", attemptedAt: old }] },
      ] },
    ]
    expect(getLeastRecentlyTried(cards).map(({ exercise }) => exercise.id)).toEqual(["never", "old", "recent"])
    expect(cards[0].exercises[0].id).toBe("recent")
  })
  it("uses local calendar days for labels", () => {
    const today = new Date(2026, 8, 15, 1)
    expect(formatFrontierLastTried(null, today)).toBe("No recorded attempts")
    expect(formatFrontierLastTried(new Date(2026, 8, 15, 0).toISOString(), today)).toBe("Tried today")
    expect(formatFrontierLastTried(new Date(2026, 8, 14, 23).toISOString(), today)).toBe("Last tried yesterday")
    expect(formatFrontierLastTried(new Date(2026, 7, 28, 23).toISOString(), today)).toBe("Last tried 18 days ago")
  })
  it("a recorded improvement or timed effort marks today without a removable manual check-in", () => {
    const today = new Date(2026, 8, 15, 13)
    const attemptedAt = new Date(2026, 8, 15, 12).toISOString()
    expect(hasAutomaticFrontierEffortToday({ ...entry, changes: [{ id: "mark", kind: "progress", recordedAt: attemptedAt }] }, today)).toBe(true)
    expect(hasAutomaticFrontierEffortToday({ ...entry, attempts: [{ id: "effort", source: "timer", attemptedAt }] }, today)).toBe(true)
    expect(hasAutomaticFrontierEffortToday({ ...entry, attempts: [{ id: "manual", attemptedAt }] }, today)).toBe(false)
  })
})
