import { describe, expect, it } from "vitest"
import { restoreElapsedSeconds } from "./timer-persistence"

describe("timer restoration", () => {
  const savedAt = "2026-08-19T12:00:00.000Z"
  const restoredAtMs = Date.parse("2026-08-19T12:00:12.900Z")

  it("adds whole background seconds only when the timer was running", () => {
    expect(restoreElapsedSeconds({ elapsedSeconds: 8, savedAt, wasRunning: true, restoredAtMs })).toBe(20)
    expect(restoreElapsedSeconds({ elapsedSeconds: 8, savedAt, wasRunning: false, restoredAtMs })).toBe(8)
  })

  it("caps restored time at a target and ignores invalid or backward timestamps", () => {
    expect(restoreElapsedSeconds({ elapsedSeconds: 8, savedAt, wasRunning: true, restoredAtMs, targetSeconds: 15 })).toBe(15)
    expect(restoreElapsedSeconds({ elapsedSeconds: 8, savedAt: "invalid", wasRunning: true, restoredAtMs })).toBe(8)
    expect(restoreElapsedSeconds({ elapsedSeconds: 8, savedAt, wasRunning: true, restoredAtMs: Date.parse(savedAt) - 5000 })).toBe(8)
    expect(restoreElapsedSeconds({ elapsedSeconds: Number.NaN, savedAt, wasRunning: true, restoredAtMs: Number.NaN })).toBe(0)
    expect(restoreElapsedSeconds({ elapsedSeconds: 8, savedAt, wasRunning: false, restoredAtMs, targetSeconds: -1 })).toBe(0)
  })
})
