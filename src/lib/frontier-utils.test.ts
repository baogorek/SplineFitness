import { describe, expect, it } from "vitest"
import { getCurrentFrontier, getCurrentFrontierChange } from "./frontier-utils"
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
