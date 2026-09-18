import { describe, expect, it } from "vitest"
import {
  isFrontierAttemptToday,
  removeFrontierAttemptsToday,
  getFrontierLastTried,
  getFrontierRecency,
  formatFrontierLastTried,
  hasAutomaticFrontierEffortToday,
  setFrontierAttemptToday,
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

describe("last tried history", () => {
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

describe("exercise recency indicators", () => {
  const today = new Date(2026, 8, 18, 12)

  it.each([
    [0, "recent", "Today"],
    [1, "recent", "1d"],
    [6, "recent", "6d"],
    [7, "aging", "7d"],
    [13, "aging", "13d"],
    [14, "stale", "14d"],
    [90, "stale", "90d"],
  ])("assigns the right color and age at %i days", (days, tone, shortLabel) => {
    const timestamp = new Date(2026, 8, 18 - days, 23).toISOString()
    expect(getFrontierRecency(timestamp, today)).toEqual({
      days, tone, shortLabel,
      description: days === 0 ? "Tried today" : days === 1 ? "Last tried yesterday" : `Last tried ${days} days ago`,
    })
  })

  it.each([null, "", "invalid"])("keeps missing or invalid history unknown: %s", (timestamp) => {
    expect(getFrontierRecency(timestamp, today)).toEqual({
      days: null, tone: "unknown", shortLabel: "—", description: "No recorded attempts",
    })
  })

  it("switches color at local midnight, rather than after complete 24-hour periods", () => {
    const timestamp = new Date(2026, 8, 11, 23, 59).toISOString()
    expect(getFrontierRecency(timestamp, new Date(2026, 8, 17, 23, 59)).tone).toBe("recent")
    expect(getFrontierRecency(timestamp, new Date(2026, 8, 18, 0)).tone).toBe("aging")
  })

  it("counts calendar days across both daylight-saving transitions", () => {
    const spring = getFrontierRecency(new Date(2026, 2, 1, 12).toISOString(), new Date(2026, 2, 8, 12))
    const fall = getFrontierRecency(new Date(2026, 9, 25, 12).toISOString(), new Date(2026, 10, 1, 12))
    expect(spring).toMatchObject({ days: 7, tone: "aging" })
    expect(fall).toMatchObject({ days: 7, tone: "aging" })
  })

  it("does not show negative ages when an effort has a future timestamp", () => {
    expect(getFrontierRecency(new Date(2026, 8, 19, 12).toISOString(), today)).toMatchObject({
      days: 0, tone: "recent", shortLabel: "Today",
    })
  })
})

describe("check-ins across cards", () => {
  const today = new Date(2026, 8, 16, 12)
  const exercise: FrontierExercise = { id: "exercise", name: "Hold", metric: "reps", changes: [], order: 0, createdAt: "", updatedAt: "" }
  const cards: FrontierCard[] = ["home", "gym"].map((id) => ({ id, name: id, exercises: [exercise], order: 0, createdAt: "", updatedAt: "" }))

  it("marks the selected card's exercise and keeps retries idempotent", () => {
    let result = setFrontierAttemptToday(cards, "gym", "exercise", true, today)
    result = setFrontierAttemptToday(result, "gym", "exercise", true, today)
    expect(result[0]).toBe(cards[0])
    expect(result[1].exercises[0].attempts).toHaveLength(1)
    expect(getFrontierLastTried(result[1].exercises[0])).toBe(today.toISOString())
    expect(getFrontierRecency(getFrontierLastTried(result[0].exercises[0]), today).tone).toBe("unknown")
    expect(getFrontierRecency(getFrontierLastTried(result[1].exercises[0]), today).tone).toBe("recent")
  })

  it("undoes today's manual check-in without changing earlier attempts", () => {
    const oldAttempt = { id: "old", attemptedAt: "2026-08-01T12:00:00Z" }
    const initial = [{ ...cards[0], exercises: [{ ...exercise, attempts: [oldAttempt] }] }]
    const checked = setFrontierAttemptToday(initial, "home", "exercise", true, today)
    let result = setFrontierAttemptToday(checked, "home", "exercise", false, today)
    result = setFrontierAttemptToday(result, "home", "exercise", false, today)
    expect(result[0].exercises[0].attempts).toEqual([oldAttempt])
  })

  it("preserves automatic efforts and never creates a redundant manual attempt", () => {
    const initial = [{ ...cards[0], exercises: [{ ...exercise, attempts: [{ id: "timer", source: "timer" as const, attemptedAt: today.toISOString(), elapsedSeconds: 30 }] }] }]
    expect(setFrontierAttemptToday(initial, "home", "exercise", true, today)).toBe(initial)
    expect(setFrontierAttemptToday(initial, "home", "exercise", false, today)).toBe(initial)
  })

  it("handles manual check-ins archived under an earlier measurement", () => {
    const initial = [{ ...cards[0], exercises: [{ ...exercise, metricHistory: [{ id: "past", metric: "freeform" as const, changes: [], attempts: [{ id: "manual", attemptedAt: today.toISOString() }], endedAt: today.toISOString() }] }] }]
    expect(setFrontierAttemptToday(initial, "home", "exercise", true, today)).toBe(initial)
    const result = setFrontierAttemptToday(initial, "home", "exercise", false, today)
    expect(getFrontierLastTried(result[0].exercises[0])).toBeNull()
  })
})
