import { describe, expect, it } from "vitest"
import { buildCircuitCompactConfig, parseCircuitConfig } from "./circuit-config"
import { CircuitWorkoutSession } from "@/types/workout"

describe("circuit configuration", () => {
  it("rejects unsupported variants and malformed durations", () => {
    expect(parseCircuitConfig('{"v":"C","d":60,"c":{}}')).toBeNull()
    expect(parseCircuitConfig('{"v":"A","d":"60","c":{}}')).toBeNull()
    expect(parseCircuitConfig('{"v":"A","d":0,"c":{}}')).toBeNull()
  })

  it("filters invalid choices and equipment values", () => {
    const parsed = parseCircuitConfig(JSON.stringify({
      v: "A",
      d: 60,
      c: {
        "handstand-pushups": "alternative",
        "jump-squats": "alternative",
      },
      e: {
        "alt-single-leg-box-squats": "12 in",
        "one-half-bottomed-out-squats": "500 lbs",
      },
    }))

    expect(parsed?.c).toEqual({ "handstand-pushups": "alternative" })
    expect(parsed?.e).toEqual({ "alt-single-leg-box-squats": "12 in" })
  })

  it("round-trips per-exercise duration overrides", () => {
    const session: CircuitWorkoutSession = {
      mode: "circuit",
      workoutId: "circuit-a",
      variant: "A",
      startedAt: "2026-08-19T12:00:00.000Z",
      rounds: [],
      exerciseSettings: {
        "handstand-pushups": { durationSeconds: 60 },
        "rotational-pushups": { durationSeconds: 60 },
        "cobra-pushups": { durationSeconds: 90 },
      },
      exerciseChoices: { "handstand-pushups": "alternative" },
      exerciseEquipment: { "alt-single-leg-box-squats": "12 in" },
    }

    expect(parseCircuitConfig(buildCircuitCompactConfig(session))).toEqual({
      v: "A",
      d: 60,
      s: { "cobra-pushups": 90 },
      c: { "handstand-pushups": "alternative" },
      e: { "alt-single-leg-box-squats": "12 in" },
    })
  })

  it("retains all valid durations when importing a full session", () => {
    const parsed = parseCircuitConfig(JSON.stringify({
      mode: "circuit",
      variant: "B",
      exerciseSettings: {
        first: { durationSeconds: 45 },
        second: { durationSeconds: 75 },
      },
      exerciseChoices: {},
    }))

    expect(parsed).toMatchObject({
      v: "B",
      s: { first: 45, second: 75 },
    })
  })
})
