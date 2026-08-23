import { describe, expect, it } from "vitest"
import {
  isFrontierAttemptToday,
  removeFrontierAttemptsToday,
} from "./frontier-attempts"
import { FrontierAttempt } from "@/types/frontier"

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
})
