import { describe, expect, it } from "vitest"
import { normalizeFrontierCard, parseFrontierExerciseName } from "./frontier-structure"
import { FrontierCard } from "@/types/frontier"

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

describe("Frontier card normalization", () => {
  it("upgrades an obvious imported weight/time history on load", () => {
    const card: FrontierCard = {
      id: "card",
      name: "Gym",
      exercises: [{
        id: "exercise",
        name: "Hip Abduction",
        equipment: "Machine",
        bodyPart: "Legs",
        metric: "freeform",
        changes: [
          { id: "first", rawValue: "120lb / 1:30", kind: "import" },
          { id: "second", rawValue: "120 / 1:45", kind: "import" },
        ],
        order: 0,
        createdAt: "2026-08-20T12:00:00.000Z",
        updatedAt: "2026-08-20T12:00:00.000Z",
      }],
      order: 0,
      createdAt: "2026-08-20T12:00:00.000Z",
      updatedAt: "2026-08-20T12:00:00.000Z",
    }

    const normalized = normalizeFrontierCard(card)
    expect(normalized.exercises[0].metric).toBe("weight-time")
    expect(normalized.exercises[0].changes[1].value).toEqual({
      primary: 120,
      secondary: 105,
    })
  })
})
