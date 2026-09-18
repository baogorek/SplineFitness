import { describe, expect, it } from "vitest"
import {
  advanceSitWarmup, canAdvanceSitWarmup, createSitWarmup, getWarmupElapsed,
  isLegacySitWarmup, pauseSitWarmup, repeatSitWarmup, restoreSitWarmup,
  SIT_WARMUP_STEPS, startSitWarmupStep, tickSitWarmup,
} from "./sit-warmup"

const runIndex = SIT_WARMUP_STEPS.findIndex((step) => step.kind === "run")
const active = (index = 0, now = 5000) => tickSitWarmup(startSitWarmupStep(createSitWarmup(index), 0), now)

describe("guided sprint warmup", () => {
  it("has four progressively faster distance-based runs, each followed by recovery", () => {
    const runs = SIT_WARMUP_STEPS.filter((step) => step.kind === "run")
    expect(runs.map((step) => step.effort)).toEqual([60, 70, 80, 90])
    for (const run of runs) {
      expect(SIT_WARMUP_STEPS[SIT_WARMUP_STEPS.indexOf(run) + 1].kind).toBe("recovery")
      expect(run.seconds).toBe(0)
    }
    expect(SIT_WARMUP_STEPS.at(-1)?.seconds).toBe(180)
  })

  it("does not charge setup or countdown time to the exercise", () => {
    const ready = createSitWarmup()
    expect(getWarmupElapsed(ready, 200000)).toBe(0)
    const countdown = startSitWarmupStep(ready, 200000)
    expect(tickSitWarmup(countdown, 204999).status).toBe("countdown")
    const go = tickSitWarmup(countdown, 205000)
    expect(go.status).toBe("active")
    expect(getWarmupElapsed(go, 205000)).toBe(0)
    expect(getWarmupElapsed(go, 208000)).toBe(3000)
  })

  it("starts on a delayed Go cue without silently using up work time", () => {
    const state = tickSitWarmup(startSitWarmupStep(createSitWarmup(), 1000), 20000)
    expect(state.startedAtMs).toBe(20000)
    expect(getWarmupElapsed(state, 20000)).toBe(0)
  })

  it("finishes a timed movement after a late tick but waits before starting the next one", () => {
    const done = tickSitWarmup(active(), 500000)
    expect(done.status).toBe("done")
    expect(done.stepIndex).toBe(0)
    const next = advanceSitWarmup(done, 500000)
    expect(next.stepIndex).toBe(1)
    expect(next.status).toBe("ready")
    expect(getWarmupElapsed(next, 600000)).toBe(0)
  })

  it("waits for a manual finish on a distance-based run, however long it takes", () => {
    const running = active(runIndex)
    expect(tickSitWarmup(running, 900000).stepIndex).toBe(runIndex)
    expect(tickSitWarmup(running, 900000).status).toBe("active")
    const recovery = advanceSitWarmup(running, 900000)
    expect(recovery.stepIndex).toBe(runIndex + 1)
    expect(recovery.startedAtMs).toBe(900000)
  })

  it("waits for recovery and user readiness, even when several minutes pass", () => {
    const recovery = advanceSitWarmup(active(runIndex), 15000)
    expect(canAdvanceSitWarmup(recovery, 74999)).toBe(false)
    expect(canAdvanceSitWarmup(recovery, 75000)).toBe(true)
    expect(tickSitWarmup(recovery, 900000).stepIndex).toBe(runIndex + 1)
    const next = advanceSitWarmup(recovery, 900000)
    expect(next.stepIndex).toBe(runIndex + 2)
    expect(next.status).toBe("ready")
  })

  it("repeats the same effort after recovery rather than increasing intensity", () => {
    const recovery = advanceSitWarmup(active(runIndex), 15000)
    expect(repeatSitWarmup(recovery, 30000)).toBe(recovery)
    const repeated = repeatSitWarmup(recovery, 75000)
    expect(repeated).toEqual(createSitWarmup(runIndex))
    expect(advanceSitWarmup(active(repeated.stepIndex, 5000), 15000).stepIndex).toBe(runIndex + 1)
  })

  it("preserves work through pause and excludes the resumed countdown", () => {
    const paused = pauseSitWarmup(active(), 17000)
    expect(paused.elapsedMs).toBe(12000)
    expect(getWarmupElapsed(paused, 50000)).toBe(12000)
    const resumed = tickSitWarmup(startSitWarmupStep(paused, 50000), 55000)
    expect(getWarmupElapsed(resumed, 57000)).toBe(14000)
  })

  it("cancels countdowns without starting work", () => {
    const cancelled = pauseSitWarmup(startSitWarmupStep(createSitWarmup(), 0), 4000)
    expect(cancelled.status).toBe("ready")
    expect(tickSitWarmup(cancelled, 8000).status).toBe("ready")
  })

  it("supports accelerated checks without changing real-session durations", () => {
    const state = startSitWarmupStep(createSitWarmup(), 0, 10)
    expect(state.countdownEndsAtMs).toBe(500)
    const started = tickSitWarmup(state, 500, 10)
    expect(tickSitWarmup(started, 18500, 10).status).toBe("done")
  })

  it("restores work paused, interrupted runs at setup, and completed work at its boundary", () => {
    expect(restoreSitWarmup({ ...active(), elapsedMs: 30000 }).status).toBe("paused")
    expect(restoreSitWarmup({ ...active(), elapsedMs: 180000 }).status).toBe("done")
    expect(restoreSitWarmup({ ...active(runIndex), elapsedMs: 5000 })).toEqual(createSitWarmup(runIndex))
    expect(restoreSitWarmup({ ...createSitWarmup(), stepIndex: 100 })).toEqual(createSitWarmup())
  })

  it("distinguishes old warmups from saved sprint sessions", () => {
    expect(isLegacySitWarmup("neural-left")).toBe(true)
    expect(isLegacySitWarmup("washout")).toBe(true)
    expect(isLegacySitWarmup("guided-warmup")).toBe(false)
    expect(isLegacySitWarmup("sprint-recovery")).toBe(false)
  })
})
