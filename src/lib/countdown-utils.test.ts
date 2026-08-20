import { afterEach, describe, expect, it, vi } from "vitest"
import { scheduleCountdownTicks } from "./countdown-utils"

describe("countdown scheduling", () => {
  afterEach(() => vi.useRealTimers())

  it("plays one immediate tick per countdown second at the requested speed", () => {
    vi.useFakeTimers()
    const playTick = vi.fn()

    scheduleCountdownTicks(playTick, 3, 2)
    vi.advanceTimersByTime(0)
    expect(playTick).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(500)
    expect(playTick).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(500)
    expect(playTick).toHaveBeenCalledTimes(3)
  })

  it("uses safe defaults for invalid durations and speed multipliers", () => {
    vi.useFakeTimers()
    const playTick = vi.fn()

    expect(scheduleCountdownTicks(playTick, Number.NaN, 1)).toEqual([])
    scheduleCountdownTicks(playTick, 2, 0)
    vi.advanceTimersByTime(1000)
    expect(playTick).toHaveBeenCalledTimes(2)
  })
})
