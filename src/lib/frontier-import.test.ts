import { describe, expect, it } from "vitest"
import { parseSpreadsheetPaste } from "./frontier-import"

describe("Frontier spreadsheet import organization", () => {
  it("parses obvious weight/time variants and removes an adjacent duplicate", () => {
    const parsed = parseSpreadsheetPaste([
      "Station / Area\tBody Part\tExercise\tOldest\tOlder\tOld\tRecent\tCurrent\tDuplicate",
      "Machine\tLegs\tHip Abduction\t120lb / 1:30\t120 / 1:45\t120lb / 2:00\t130 lb / 1:30\t130lb / 1:45\t130lb/1:45",
    ].join("\n"))

    expect(parsed.rows[0]?.metric).toBe("weight-time")
    expect(parsed.rows[0]?.marks).toHaveLength(5)
    expect(parsed.rows[0]?.marks[1]).toEqual({
      rawValue: "120 / 1:45",
      value: { primary: 120, secondary: 105 },
    })
    expect(parsed.rows[0]?.marks.at(-1)).toEqual({
      rawValue: "130lb/1:45",
      value: { primary: 130, secondary: 105 },
    })
  })

  it("keeps a known station from a two-part name and flags the missing body part", () => {
    const parsed = parseSpreadsheetPaste(
      "MT - Calf raises (uses lift plate)\tBW / 1:00"
    )

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]).toMatchObject({
      name: "Calf raises (uses lift plate)",
      equipment: "Multitrainer",
      warnings: [
        "Body part is missing; use Legs, Back, Shoulders, Core, Chest, or Arms",
      ],
    })
  })

  it("accepts Station / Area as a structured column heading", () => {
    const parsed = parseSpreadsheetPaste([
      "Station / Area\tBody Part\tExercise\tCurrent",
      "Multitrainer\tLegs\tCalf raises (uses lift plate)\tBW / 1:00",
    ].join("\n"))

    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]).toMatchObject({
      name: "Calf raises (uses lift plate)",
      equipment: "Multitrainer",
      bodyPart: "Legs",
      warnings: [],
    })
  })

  it("warns when an unstructured row has no station or body part", () => {
    const parsed = parseSpreadsheetPaste("Calf raises\tBW / 1:00")

    expect(parsed.rows[0]?.warnings).toEqual([
      "Station / area is missing; this exercise will be placed under Unassigned station",
      "Body part is missing; use Legs, Back, Shoulders, Core, Chest, or Arms",
    ])
  })
})
