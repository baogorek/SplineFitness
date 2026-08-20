import { describe, expect, it } from "vitest"
import { parseFrontierExerciseName } from "./frontier-structure"

describe("Frontier exercise name parsing", () => {
  it("parses the full station, body-part, and exercise convention", () => {
    expect(parseFrontierExerciseName("MT - Legs - Calf raises (uses lift plate)")).toEqual({
      name: "Calf raises (uses lift plate)",
      equipment: "Multitrainer",
      bodyPart: "Legs",
    })
  })

  it("recovers a known station from the older two-part shorthand", () => {
    expect(parseFrontierExerciseName("MT - Calf raises (uses lift plate)")).toEqual({
      name: "Calf raises (uses lift plate)",
      equipment: "Multitrainer",
      bodyPart: null,
    })
  })

  it("does not mistake an arbitrary hyphenated exercise name for a station", () => {
    expect(parseFrontierExerciseName("Machine - assisted pull-up")).toBeNull()
  })
})
