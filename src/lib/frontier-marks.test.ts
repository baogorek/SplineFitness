import { describe, expect, it } from "vitest"
import {
  appendUniqueFrontierChanges,
  normalizeFrontierExerciseMarks,
  parseFrontierMark,
  parseFrontierMarkHistory,
} from "./frontier-marks"
import { FrontierChange, FrontierExercise } from "@/types/frontier"

describe("Frontier mark parsing", () => {
  it.each([
    "130lb/1:45",
    "130lb / 1:45",
    "130 lb / 1:45",
  ])("parses an obvious weight/time mark: %s", (rawValue) => {
    expect(parseFrontierMark(rawValue)).toEqual({
      metric: "weight-time",
      value: { primary: 130, secondary: 105 },
    })
  })

  it("parses unitless shorthand only with established weight/time context", () => {
    expect(parseFrontierMark("120 / 1:45")).toBeNull()
    expect(parseFrontierMark("120 / 1:45", "weight-time")).toEqual({
      metric: "weight-time",
      value: { primary: 120, secondary: 105 },
    })
  })

  it("uses explicit marks to parse a compatible history", () => {
    expect(parseFrontierMarkHistory([
      "120lb / 1:30",
      "120 / 1:45",
      "130lb/1:45",
    ])).toEqual({
      metric: "weight-time",
      marks: [
        { metric: "weight-time", value: { primary: 120, secondary: 90 } },
        { metric: "weight-time", value: { primary: 120, secondary: 105 } },
        { metric: "weight-time", value: { primary: 130, secondary: 105 } },
      ],
    })
  })

  it("keeps a mixed or ambiguous history as free text", () => {
    expect(parseFrontierMarkHistory(["120 / 1:45"])).toBeNull()
    expect(parseFrontierMarkHistory(["20 lb", "twenty-ish"])).toBeNull()
  })
})

describe("Frontier mark normalization", () => {
  const exercise: FrontierExercise = {
    id: "exercise",
    name: "Hip Abduction",
    equipment: "Machine",
    bodyPart: "Legs",
    metric: "freeform",
    changes: [
      { id: "old", rawValue: "120lb / 1:30", kind: "import" },
      { id: "duplicate", rawValue: "130lb / 1:45", kind: "import" },
      {
        id: "current",
        rawValue: "130lb/1:45",
        recordedAt: "2026-08-22T12:00:00.000Z",
        kind: "progress",
      },
    ],
    order: 0,
    createdAt: "2026-08-20T12:00:00.000Z",
    updatedAt: "2026-08-22T12:00:00.000Z",
  }

  it("upgrades a parseable free-text history and keeps the newer duplicate event", () => {
    const normalized = normalizeFrontierExerciseMarks(exercise)

    expect(normalized.metric).toBe("weight-time")
    expect(normalized.changes.map((change) => change.id)).toEqual(["old", "current"])
    expect(normalized.changes.at(-1)?.value).toEqual({ primary: 130, secondary: 105 })
    expect(normalized.changes.at(-1)?.recordedAt).toBe("2026-08-22T12:00:00.000Z")
  })

  it("does not replace a current user event with a duplicate import", () => {
    const current: FrontierChange = {
      id: "current",
      value: { primary: 130, secondary: 105 },
      recordedAt: "2026-08-22T12:00:00.000Z",
      kind: "progress",
    }
    const incoming: FrontierChange = {
      id: "incoming",
      value: { primary: 130, secondary: 105 },
      rawValue: "130 lb / 1:45",
      kind: "import",
    }

    expect(appendUniqueFrontierChanges([current], [incoming])).toEqual([current])
  })
})
