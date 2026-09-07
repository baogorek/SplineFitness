import { describe, expect, it } from "vitest"
import { FrontierExercise } from "@/types/frontier"
import {
  createFrontierTimer,
  finishFrontierTimer,
  formatFrontierTimerTime,
  getFrontierTimerSnapshot,
  getFrontierTimerTarget,
  pauseFrontierTimer,
  resumeFrontierTimer,
  startFrontierTimer,
} from "./frontier-timer"

function exercise(metric: FrontierExercise["metric"], primary: number, secondary?: number): FrontierExercise {
  return {
    id: "hold", name: "Hold", metric, order: 0, createdAt: "", updatedAt: "",
    changes: [{ id: "mark", kind: "progress", value: { primary, secondary } }],
  }
}

describe("frontier timer", () => {
  it("counts down 5, 4, 3, 2, 1 before any effort time accrues", () => {
    const state = startFrontierTimer(60, 1000)
    for (let second = 0; second < 5; second++) {
      expect(getFrontierTimerSnapshot(state, 1000 + second * 1000)).toMatchObject({
        prepRemainingSeconds: 5 - second, elapsedSeconds: 0, remainingSeconds: 60,
      })
    }
    expect(getFrontierTimerSnapshot(state, 6000)).toMatchObject({
      prepRemainingSeconds: 0, elapsedSeconds: 0, remainingSeconds: 60,
    })
    expect(getFrontierTimerSnapshot(state, 7250)).toMatchObject({ elapsedSeconds: 1.25, remainingSeconds: 58.75 })
  })

  it("keeps total time running at and beyond a fractional target", () => {
    const state = startFrontierTimer(12.5, 0)
    expect(getFrontierTimerSnapshot(state, 17499).targetReached).toBe(false)
    expect(getFrontierTimerSnapshot(state, 17500)).toMatchObject({
      targetReached: true, elapsedSeconds: 12.5, remainingSeconds: 0, overtimeSeconds: 0,
    })
    expect(getFrontierTimerSnapshot(state, 21300)).toMatchObject({
      targetReached: true, elapsedSeconds: 16.3,
    })
    expect(getFrontierTimerSnapshot(state, 21300).overtimeSeconds).toBeCloseTo(3.8)
    expect(state.status).toBe("running")
  })

  it("reconciles an entire setup and target skipped by a sleeping tab", () => {
    const state = startFrontierTimer(60, 1000)
    expect(getFrontierTimerSnapshot(state, 301000)).toMatchObject({
      prepRemainingSeconds: 0, elapsedSeconds: 295, remainingSeconds: 0, targetReached: true, overtimeSeconds: 235,
    })
  })

  it("preserves fractions across repeated pauses and excludes all paused time", () => {
    let state = startFrontierTimer(10, 0)
    state = pauseFrontierTimer(state, 6250)
    expect(getFrontierTimerSnapshot(state, 50000).elapsedSeconds).toBe(1.25)
    state = resumeFrontierTimer(state, 50000)
    state = pauseFrontierTimer(state, 50750)
    expect(getFrontierTimerSnapshot(state, 60000).elapsedSeconds).toBe(2)
    state = resumeFrontierTimer(state, 60000)
    expect(getFrontierTimerSnapshot(state, 69000)).toMatchObject({ elapsedSeconds: 11, targetReached: true })
  })

  it("can pause and resume the setup without charging it to effort time", () => {
    let state = pauseFrontierTimer(startFrontierTimer(30, 0), 1500)
    expect(getFrontierTimerSnapshot(state, 10000)).toMatchObject({ prepRemainingSeconds: 4, elapsedSeconds: 0 })
    state = resumeFrontierTimer(state, 10000)
    expect(getFrontierTimerSnapshot(state, 13499).prepRemainingSeconds).toBe(1)
    expect(getFrontierTimerSnapshot(state, 13500)).toMatchObject({ prepRemainingSeconds: 0, elapsedSeconds: 0 })
  })

  it("freezes the exact total on finish before or after the target", () => {
    const running = startFrontierTimer(10, 0)
    const early = finishFrontierTimer(running, 8400)
    expect(getFrontierTimerSnapshot(early, 90000)).toMatchObject({ elapsedSeconds: 3.4, targetReached: false })
    const paused = pauseFrontierTimer(running, 18300)
    const finished = finishFrontierTimer(paused, 99000)
    expect(getFrontierTimerSnapshot(finished, 150000).elapsedSeconds).toBe(13.3)
    expect(resumeFrontierTimer(finished, 150000)).toBe(finished)
    expect(finishFrontierTimer(finished, 150000)).toBe(finished)
  })

  it("supports a stopwatch with the same setup countdown", () => {
    const state = startFrontierTimer(null, 0)
    expect(getFrontierTimerSnapshot(state, 10200)).toMatchObject({
      elapsedSeconds: 5.2, targetReached: false, remainingSeconds: 0,
    })
    expect(createFrontierTimer()).toMatchObject({ status: "ready", accumulatedMs: 0, startedAtMs: null })
  })

  it("uses duration marks and only the time portion of weight/time marks", () => {
    expect(getFrontierTimerTarget(exercise("duration-longer", 82.5))).toBe(82.5)
    expect(getFrontierTimerTarget(exercise("duration-faster", 24))).toBe(24)
    expect(getFrontierTimerTarget(exercise("weight-time", 100, 45))).toBe(45)
    expect(getFrontierTimerTarget(exercise("weight-time", 100))).toBeNull()
    expect(getFrontierTimerTarget(exercise("reps", 12))).toBeNull()
    expect(getFrontierTimerTarget(exercise("freeform", 12))).toBeNull()
    expect(getFrontierTimerTarget(null)).toBeNull()
    const corrected = exercise("duration-longer", 90)
    corrected.changes.push({ id: "correction", kind: "correction", value: { primary: 65 } })
    corrected.changes.push({ id: "unparsed", kind: "import", rawValue: "unknown" })
    expect(getFrontierTimerTarget(corrected)).toBe(65)
  })

  it("rounds countdowns up and elapsed time down to a tenth", () => {
    expect(formatFrontierTimerTime(59.999, true)).toBe("01:00.0")
    expect(formatFrontierTimerTime(59.999)).toBe("00:59.9")
    expect(formatFrontierTimerTime(0.001, true)).toBe("00:00.1")
    expect(formatFrontierTimerTime(3601.25)).toBe("60:01.2")
  })
})
