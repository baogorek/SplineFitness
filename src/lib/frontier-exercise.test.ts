import { describe, expect, it } from "vitest"
import { FrontierEntrySave, FrontierExercise } from "@/types/frontier"
import { updateFrontierExercise } from "./frontier-exercise"
import { normalizeFrontierExerciseMarks } from "./frontier-marks"
import { formatFrontierChange, getCurrentFrontier } from "./frontier-utils"

const exercise: FrontierExercise = {
  id: "exercise",
  name: "Squat",
  equipment: "Rack",
  bodyPart: "Legs",
  metric: "reps",
  changes: [{ id: "mark", value: { primary: 10 }, kind: "progress" }],
  attempts: [{ id: "attempt", attemptedAt: "2026-09-06T12:00:00.000Z" }],
  order: 2,
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-06T12:00:00.000Z",
}
const now = "2026-09-07T12:00:00.000Z"
const entry: FrontierEntrySave = {
  name: exercise.name,
  equipment: "Rack",
  bodyPart: "Legs",
  metric: "weight-time",
  value: { primary: 10, secondary: 6.6 },
  rawValue: null,
  valueAction: "progress",
}

describe("Changing a Frontier exercise measurement", () => {
  it("keeps the exercise identity and archives marks and attempts in their original units", () => {
    const updated = updateFrontierExercise(exercise, entry, now)
    expect(updated).toMatchObject({ id: exercise.id, order: 2, createdAt: exercise.createdAt, metric: "weight-time", attempts: [] })
    expect(updated.changes).toHaveLength(1)
    expect(getCurrentFrontier(updated.changes)).toEqual({ primary: 10, secondary: 6.6 })
    const history = updated.metricHistory![0]
    expect(history).toMatchObject({ metric: "reps", changes: exercise.changes, attempts: exercise.attempts, endedAt: now })
    expect(formatFrontierChange(history.metric, history.changes[0])).toBe("10 reps")
    expect(exercise.metric).toBe("reps")
    expect(exercise.metricHistory).toBeUndefined()
  })

  it("allows changing measurement without entering a new mark", () => {
    const updated = updateFrontierExercise(exercise, { ...entry, value: null, valueAction: "none" }, now)
    expect(updated.metric).toBe("weight-time")
    expect(getCurrentFrontier(updated.changes)).toBeNull()
    expect(updated.metricHistory![0].changes).toEqual(exercise.changes)
  })

  it("records a new baseline even when its number matches the old metric", () => {
    const updated = updateFrontierExercise(exercise, { ...entry, metric: "weight", value: { primary: 10 }, valueAction: "unchanged" }, now)
    expect(updated.changes).toHaveLength(1)
    expect(updated.changes[0].id).not.toBe("mark")
    expect(formatFrontierChange(updated.metric, updated.changes[0])).toBe("10 lb")
  })

  it("keeps repeated metric changes separate, including a return to the original type", () => {
    const weighted = updateFrontierExercise(exercise, entry, now)
    const repsAgain = updateFrontierExercise(weighted, { ...entry, metric: "reps", value: { primary: 5 } }, now)
    expect(repsAgain.metricHistory?.map((history) => history.metric)).toEqual(["reps", "weight-time"])
    expect(getCurrentFrontier(repsAgain.changes)).toEqual({ primary: 5 })
    expect(weighted.metricHistory).toHaveLength(1)
  })

  it("keeps a deliberately selected custom metric after serialization and normalization", () => {
    const updated = updateFrontierExercise(exercise, { ...entry, metric: "freeform", value: null, rawValue: "20 lb" }, now)
    const reloaded = normalizeFrontierExerciseMarks(JSON.parse(JSON.stringify(updated)))
    expect(reloaded.metric).toBe("freeform")
    expect(reloaded.changes[0].rawValue).toBe("20 lb")
    expect(reloaded.metricHistory).toEqual(updated.metricHistory)
  })

  it("does not create an empty archive for an exercise without any marks or attempts", () => {
    const updated = updateFrontierExercise({ ...exercise, changes: [], attempts: [] }, { ...entry, value: null, valueAction: "none" }, now)
    expect(updated.metricHistory).toBeUndefined()
    expect(updated.metric).toBe("weight-time")
  })

  it("keeps current history and attempts when editing details or correcting the same metric", () => {
    const renamed = updateFrontierExercise(exercise, { ...entry, metric: "reps", name: "Back squat", value: { primary: 10 }, valueAction: "unchanged" }, now)
    expect(renamed.name).toBe("Back squat")
    expect(renamed.changes).toEqual(exercise.changes)
    expect(renamed.attempts).toEqual(exercise.attempts)
    expect(renamed.metricHistory).toBeUndefined()
    const corrected = updateFrontierExercise(renamed, { ...entry, metric: "reps", value: { primary: 8 }, valueAction: "correction" }, now)
    expect(corrected.changes).toHaveLength(2)
    expect(corrected.changes.at(-1)).toMatchObject({ kind: "correction", value: { primary: 8 } })
    expect(corrected.attempts).toEqual(exercise.attempts)
  })
})
