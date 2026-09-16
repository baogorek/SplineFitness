import { describe, expect, it } from "vitest"
import { getFrontierTimerProposal, recordFrontierTimerEffort, undoFrontierTimerEffort, getLatestFrontierTimerEffort } from "./frontier-effort"
import { getFrontierLastTried } from "./frontier-attempts"
import { getFrontierTimerTarget } from "./frontier-timer"
import { FrontierAttempt, FrontierCard, FrontierExercise, FrontierMetric } from "@/types/frontier"

function exercise(metric: FrontierMetric = "duration-longer", primary = 90, secondary?: number): FrontierExercise {
  return { id: "exercise", name: "Hold", metric, order: 0, createdAt: "", updatedAt: "", changes: [
    { id: "mark", kind: "import", value: { primary, ...(secondary === undefined ? {} : { secondary }) } },
  ] }
}
const custom = { ...exercise("freeform"), changes: [{ id: "custom", kind: "import" as const, rawValue: "arms side / 1:45" }] }
const attempt: FrontierAttempt = { id: "effort", attemptedAt: "2026-09-15T16:00:00Z", elapsedSeconds: 111, source: "timer" }
function wallet(entry = exercise()): FrontierCard[] {
  return [
    { id: "original", name: "Gym", exercises: [entry], order: 0, createdAt: "", updatedAt: "" },
    { id: "other", name: "Home", exercises: [exercise("reps", 12)], order: 1, createdAt: "", updatedAt: "" },
  ]
}

describe("frontier suggestions from real effort times", () => {
  it.each([90, 99, 104.9, 104.999])("does not round %s seconds into eligibility", (seconds) => {
    expect(getFrontierTimerProposal(exercise(), seconds)).toBeNull()
  })
  it.each([[105, 105], [111, 105], [112.5, 120], [119, 120]])("rounds %s only after the full 15-second improvement", (seconds, rounded) => {
    expect(getFrontierTimerProposal(exercise(), seconds)).toEqual({ value: { primary: rounded } })
  })
  it("measures against the stored frontier, including non-rounded marks", () => {
    expect(getFrontierTimerProposal(exercise("duration-longer", 92), 106.99)).toBeNull()
    expect(getFrontierTimerProposal(exercise("duration-longer", 92), 107)).toEqual({ value: { primary: 105 } })
  })
  it("requires 15 seconds faster for completion times", () => {
    expect(getFrontierTimerProposal(exercise("duration-faster"), 75.001)).toBeNull()
    expect(getFrontierTimerProposal(exercise("duration-faster"), 75)).toEqual({ value: { primary: 75 } })
    expect(getFrontierTimerProposal(exercise("duration-faster"), 110)).toBeNull()
  })
  it("preserves the custom descriptor and uses the custom time as the target", () => {
    expect(getFrontierTimerTarget(custom)).toBe(105)
    expect(getFrontierTimerProposal(custom, 119.999)).toBeNull()
    expect(getFrontierTimerProposal(custom, 120)).toEqual({ rawValue: "arms side / 2:00" })
    expect(getFrontierTimerProposal({ ...custom, changes: [{ ...custom.changes[0], rawValue: "arms side/1:45" }] }, 130)).toEqual({ rawValue: "arms side/2:15" })
  })
  it.each(["520 Peak / 435 Avg", "level / 12", "arms side", "hold / 1:99", "hold / -20s"])("does not infer a duration from %s", (rawValue) => {
    const entry = { ...custom, changes: [{ ...custom.changes[0], rawValue }] }
    expect(getFrontierTimerTarget(entry)).toBeNull()
    expect(getFrontierTimerProposal(entry, 200)).toBeNull()
  })
  it("requires the confirmed weight and never promotes a lower load", () => {
    const entry = exercise("weight-time", 130, 90)
    expect(getFrontierTimerProposal(entry, 105)).toBeNull()
    expect(getFrontierTimerProposal(entry, 105, 120)).toBeNull()
    expect(getFrontierTimerProposal(entry, 104.99, 140)).toBeNull()
    expect(getFrontierTimerProposal(entry, 105, 130)).toEqual({ value: { primary: 130, secondary: 105 } })
  })
  it("can establish a first time mark without inventing a custom mark", () => {
    expect(getFrontierTimerProposal({ ...exercise(), changes: [] }, 40)).toEqual({ value: { primary: 45 } })
    expect(getFrontierTimerProposal({ ...custom, changes: [] }, 40)).toBeNull()
  })
  it.each(["reps", "weight", "speed"] as const)("does not change a %s frontier based on time", (metric) => {
    expect(getFrontierTimerProposal(exercise(metric), 300)).toBeNull()
  })
  it.each([0, -1, NaN, Infinity])("rejects invalid elapsed time %s", (seconds) => {
    expect(getFrontierTimerProposal(exercise(), seconds)).toBeNull()
  })
})

describe("recording a timed effort", () => {
  it("records even a short effort without changing the frontier", () => {
    const cards = wallet()
    const result = recordFrontierTimerEffort(cards, "original", "exercise", { ...attempt, elapsedSeconds: 2 })
    expect(result[0].exercises[0].attempts?.[0].elapsedSeconds).toBe(2)
    expect(result[0].exercises[0].changes).toEqual(cards[0].exercises[0].changes)
    expect(cards[0].exercises[0].attempts).toBeUndefined()
  })
  it("targets the original card even when another card has the same exercise ID", () => {
    const cards = wallet()
    const result = recordFrontierTimerEffort(cards, "original", "exercise", attempt)
    expect(result[1]).toBe(cards[1])
    expect(result[0].exercises[0].attempts).toEqual([attempt])
  })
  it("links the confirmed mark to its effort and makes both saves retryable", () => {
    const baseline = exercise()
    const update = { baseline, proposal: getFrontierTimerProposal(baseline, 111)! }
    let cards = recordFrontierTimerEffort(wallet(baseline), "original", "exercise", attempt)
    cards = recordFrontierTimerEffort(cards, "original", "exercise", attempt)
    cards = recordFrontierTimerEffort(cards, "original", "exercise", attempt, update)
    cards = recordFrontierTimerEffort(cards, "original", "exercise", attempt, update)
    expect(cards[0].exercises[0].attempts).toEqual([attempt])
    expect(cards[0].exercises[0].changes).toHaveLength(2)
    expect(cards[0].exercises[0].changes[1]).toMatchObject({ attemptId: attempt.id, recordedAt: attempt.attemptedAt, value: { primary: 105 } })
  })
  it("rejects stale frontier proposals while retaining the recorded attempt", () => {
    const baseline = exercise()
    const cards = recordFrontierTimerEffort(wallet(baseline), "original", "exercise", attempt)
    cards[0].exercises[0].changes = [{ id: "newer", kind: "progress", value: { primary: 120 } }]
    expect(() => recordFrontierTimerEffort(cards, "original", "exercise", attempt, { baseline, proposal: { value: { primary: 105 } } })).toThrow("frontier changed")
    expect(cards[0].exercises[0].attempts).toHaveLength(1)
  })
  it("does not overwrite edits to the name when saving a timer result", () => {
    const baseline = exercise()
    const cards = wallet({ ...baseline, name: "Renamed hold" })
    const result = recordFrontierTimerEffort(cards, "original", "exercise", attempt, { baseline, proposal: { value: { primary: 105 } } })
    expect(result[0].exercises[0].name).toBe("Renamed hold")
  })
  it("does not resurrect a deleted exercise", () => {
    expect(() => recordFrontierTimerEffort([], "original", "exercise", attempt)).toThrow("removed")
  })
  it("does not duplicate a timed effort after a measurement change archives it", () => {
    const entry = { ...exercise("reps"), metricHistory: [{ id: "history", metric: "duration-longer" as const, changes: [], attempts: [attempt], endedAt: attempt.attemptedAt }] }
    const cards = recordFrontierTimerEffort(wallet(entry), "original", "exercise", attempt)
    expect(cards[0].exercises[0].attempts).toEqual([])
    expect(cards[0].exercises[0].metricHistory?.[0].attempts).toHaveLength(1)
  })
})

describe("undoing a timed effort", () => {
  const earlier: FrontierAttempt = { ...attempt, id: "earlier", attemptedAt: "2026-09-01T16:00:00Z" }

  it("restores the previous tried date and leaves other cards untouched", () => {
    const cards = recordFrontierTimerEffort(wallet({ ...exercise(), attempts: [earlier] }), "original", "exercise", attempt)
    const result = undoFrontierTimerEffort(cards, "original", "exercise", attempt.id)
    expect(result[0].exercises[0].attempts).toEqual([earlier])
    expect(getFrontierLastTried(result[0].exercises[0])).toBe(earlier.attemptedAt)
    expect(result[1]).toBe(cards[1])
    expect(cards[0].exercises[0].attempts).toHaveLength(2)
  })

  it("removes the effort's confirmed mark and restores the original frontier", () => {
    const baseline = exercise()
    const cards = recordFrontierTimerEffort(wallet(baseline), "original", "exercise", attempt, { baseline, proposal: { value: { primary: 105 } } })
    const result = undoFrontierTimerEffort(cards, "original", "exercise", attempt.id)
    expect(result[0].exercises[0].changes).toEqual(baseline.changes)
    expect(getFrontierLastTried(result[0].exercises[0])).toBeNull()
  })

  it("preserves a later independent effort and mark", () => {
    const baseline = exercise()
    let cards = recordFrontierTimerEffort(wallet(baseline), "original", "exercise", attempt, { baseline, proposal: { value: { primary: 105 } } })
    const later = { ...attempt, id: "later", attemptedAt: "2026-09-16T12:00:00Z", elapsedSeconds: 135 }
    cards = recordFrontierTimerEffort(cards, "original", "exercise", later, { baseline: cards[0].exercises[0], proposal: { value: { primary: 135 } } })
    const result = undoFrontierTimerEffort(cards, "original", "exercise", attempt.id)
    expect(result[0].exercises[0].attempts).toEqual([later])
    expect(result[0].exercises[0].changes.at(-1)?.value).toEqual({ primary: 135 })
    expect(getFrontierLastTried(result[0].exercises[0])).toBe(later.attemptedAt)
  })

  it("removes archived effort dates and linked marks without changing the new measurement", () => {
    const entry: FrontierExercise = { ...exercise("reps", 12), metricHistory: [{
      id: "past", metric: "duration-longer", endedAt: attempt.attemptedAt, attempts: [earlier, attempt],
      changes: [{ id: "timed", attemptId: attempt.id, kind: "progress", value: { primary: 105 }, recordedAt: attempt.attemptedAt }],
    }] }
    const result = undoFrontierTimerEffort(wallet(entry), "original", "exercise", attempt.id)
    expect(result[0].exercises[0].metric).toBe("reps")
    expect(result[0].exercises[0].changes).toEqual(entry.changes)
    expect(result[0].exercises[0].metricHistory?.[0].changes).toEqual([])
    expect(getFrontierLastTried(result[0].exercises[0])).toBe(earlier.attemptedAt)
  })

  it("does not remove an earlier effort when retrying an undo", () => {
    const cards = recordFrontierTimerEffort(wallet({ ...exercise(), attempts: [earlier] }), "original", "exercise", attempt)
    const result = undoFrontierTimerEffort(cards, "original", "exercise", attempt.id)
    expect(undoFrontierTimerEffort(result, "original", "exercise", attempt.id)).toBe(result)
    expect(result[0].exercises[0].attempts).toEqual([earlier])
  })

  it("finds the latest timed effort across measurements without selecting manual check-ins", () => {
    expect(getLatestFrontierTimerEffort({ ...exercise(), attempts: [earlier, { ...attempt, source: "manual" }], metricHistory: [{
      id: "past", metric: "freeform", changes: [], attempts: [attempt], endedAt: attempt.attemptedAt,
    }] })).toEqual(attempt)
    expect(getLatestFrontierTimerEffort(exercise())).toBeNull()
  })

  it("does not let timer undo remove a manual check-in", () => {
    expect(() => undoFrontierTimerEffort(wallet({ ...exercise(), attempts: [{ ...attempt, source: "manual" }] }), "original", "exercise", attempt.id)).toThrow("Only a timed effort")
  })
})
