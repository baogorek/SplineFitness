import { describe, expect, it } from "vitest"
import {
  formatDuration,
  formatDurationInput,
  formatFrontierValue,
  getCurrentFrontier,
  getCurrentFrontierChange,
  isFrontierImprovement,
  parseDuration,
} from "./frontier-utils"
import { FrontierChange } from "@/types/frontier"

const changes: FrontierChange[] = [
  {
    id: "valid",
    value: { primary: 20, secondary: 60 },
    rawValue: "20 lb / 1:00",
    kind: "import",
  },
  {
    id: "mismatch",
    rawValue: "thirty reps",
    kind: "import",
  },
]

describe("frontier current values", () => {
  it("does not let a history-only mismatched mark replace a typed frontier", () => {
    expect(getCurrentFrontier(changes)).toEqual({ primary: 20, secondary: 60 })
    expect(getCurrentFrontierChange("weight-time", changes)?.id).toBe("valid")
  })

  it("uses the newest raw mark for freeform exercises", () => {
    expect(getCurrentFrontierChange("freeform", changes)?.id).toBe("mismatch")
  })
})

describe("Frontier durations", () => {
  it.each([
    ["1:30", 90],
    ["6.6", 6.6],
    ["6.6s", 6.6],
    [" 6.66S ", 6.66],
    [".6s", 0.6],
    ["0:06.6", 6.6],
    ["1:30.5", 90.5],
    ["1m30.5s", 90.5],
    ["2m 0.05s", 120.05],
  ])("parses fractional and whole times: %s", (input, expected) => {
    expect(parseDuration(input)).toBe(expected)
  })

  it.each(["", "1:60.5", "1:99", "1:2:3", "-6.6s", "6.6.6", "Infinity", "NaN"])(
    "rejects invalid times: %s", (input) => {
      expect(parseDuration(input)).toBeNull()
    }
  )

  it.each([
    [6, "6s", "0:06"],
    [6.6, "6.6s", "0:06.6"],
    [6.66, "6.66s", "0:06.66"],
    [0.001, "0.001s", "0:00.001"],
    [59.999, "59.999s", "0:59.999"],
    [60, "1:00", "1:00"],
    [60.001, "1:00.001", "1:00.001"],
    [66.6, "1:06.6", "1:06.6"],
    [90.123456, "1:30.123456", "1:30.123456"],
  ])("preserves %s seconds on the card and through editing", (seconds, display, input) => {
    expect(formatDuration(seconds)).toBe(display)
    expect(formatDurationInput(seconds)).toBe(input)
    expect(parseDuration(formatDurationInput(seconds))).toBe(seconds)
  })

  it("shows fractional times for completion, holds, and weight/time marks", () => {
    expect(formatFrontierValue("duration-faster", { primary: 6.6 })).toBe("6.6s")
    expect(formatFrontierValue("duration-longer", { primary: 66.6 })).toBe("1:06.6")
    expect(formatFrontierValue("weight-time", { primary: 100, secondary: 6.6 })).toBe("100 lb / 6.6s")
  })

  it("compares improvements at the entered precision", () => {
    expect(isFrontierImprovement("duration-faster", { primary: 6.6 }, { primary: 6.59 })).toBe(true)
    expect(isFrontierImprovement("duration-faster", { primary: 6.6 }, { primary: 6.61 })).toBe(false)
    expect(isFrontierImprovement("weight-time", { primary: 100, secondary: 6.6 }, { primary: 100, secondary: 6.61 })).toBe(true)
  })
})
