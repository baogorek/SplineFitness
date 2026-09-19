import { describe, expect, it } from "vitest"
import {
  BUILD_UP_SECONDS, createSitWarmup, finishSitWarmupSetup, formatWarmupTime,
  getWarmupElapsed, isLegacySitWarmup, pauseSitWarmup, repeatSitWarmup,
  restoreSitWarmup, SIT_WARMUP_STEPS, startSitWarmupStep, tickSitWarmup,
} from "./sit-warmup"

const runIndex = SIT_WARMUP_STEPS.findIndex((step) => step.kind === "run")
const active = (index = 0, now = 5000) => tickSitWarmup(finishSitWarmupSetup(startSitWarmupStep(createSitWarmup(index), 0), 0), now)
const recovery = () => tickSitWarmup(active(runIndex), 5000 + BUILD_UP_SECONDS * 1000)

describe("automatic sprint warmup", () => {
  it("completes every movement, four short build-ups, and recoveries without advance actions", () => {
    let state = startSitWarmupStep(createSitWarmup(), 0)
    const visited = new Set<number>()
    let now = 0
    for (let transitions = 0; transitions < 50 && state.status !== "done"; transitions += 1) {
      visited.add(state.stepIndex)
      if (state.status === "setup") now = state.setupEndsAtMs!
      else if (state.status === "countdown") now = state.countdownEndsAtMs!
      else now = state.startedAtMs! + SIT_WARMUP_STEPS[state.stepIndex].seconds * 1000
      state = tickSitWarmup(state, now)
    }
    expect(state.status).toBe("done")
    expect(visited.size).toBe(SIT_WARMUP_STEPS.length)
    const runs = SIT_WARMUP_STEPS.filter((step) => step.kind === "run")
    expect(runs.map((step) => step.intensity)).toEqual(["Easy", "Steady", "Brisk", "Fast and relaxed"])
    expect(runs.every((step) => step.seconds === 6)).toBe(true)
    expect(SIT_WARMUP_STEPS.at(-1)?.seconds).toBe(180)
  })

  it("excludes spoken setup and countdown from exercise time", () => {
    const setup = startSitWarmupStep(createSitWarmup(), 200000)
    expect(setup.status).toBe("setup")
    expect(getWarmupElapsed(setup, 207000)).toBe(0)
    const countdown = finishSitWarmupSetup(setup, 210000)
    expect(countdown.countdownEndsAtMs).toBe(215000)
    expect(tickSitWarmup(countdown, 214999).status).toBe("countdown")
    const go = tickSitWarmup(countdown, 215000)
    expect(go.status).toBe("active")
    expect(getWarmupElapsed(go, 215000)).toBe(0)
    expect(getWarmupElapsed(go, 218000)).toBe(3000)
  })

  it("gives pogos their full set before automatically preparing the first build-up", () => {
    const pogoIndex = SIT_WARMUP_STEPS.findIndex((step) => step.id === "pogos")
    const swings = active(pogoIndex - 1)
    const setup = tickSitWarmup(swings, 25000)
    expect(setup).toMatchObject({stepIndex: pogoIndex, status: "setup", elapsedMs: 0})
    const hopping = tickSitWarmup(finishSitWarmupSetup(setup, 45000), 50000)
    expect(getWarmupElapsed(hopping, 50000)).toBe(0)
    expect(tickSitWarmup(hopping, 64999)).toBe(hopping)
    const runSetup = tickSitWarmup(hopping, 65000)
    expect(runSetup).toMatchObject({stepIndex: runIndex, status: "setup", elapsedMs: 0})
  })

  it("has a finite setup fallback when the speech completion callback is missing", () => {
    const setup = startSitWarmupStep(createSitWarmup(), 1000)
    expect(tickSitWarmup(setup, setup.setupEndsAtMs! - 1).status).toBe("setup")
    const countdown = tickSitWarmup(setup, setup.setupEndsAtMs!)
    expect(countdown.status).toBe("countdown")
    expect(countdown.countdownEndsAtMs).toBe(setup.setupEndsAtMs! + 5000)
  })

  it("starts on a delayed Go cue without charging time before that cue", () => {
    const countdown = finishSitWarmupSetup(startSitWarmupStep(createSitWarmup(), 1000), 2000)
    const go = tickSitWarmup(countdown, 30000)
    expect(go.startedAtMs).toBe(30000)
    expect(getWarmupElapsed(go, 30000)).toBe(0)
  })

  it("crosses only one boundary after a long suspension, preserving the next setup", () => {
    const next = tickSitWarmup(active(), 500000)
    expect(next.stepIndex).toBe(1)
    expect(next.status).toBe("setup")
    expect(getWarmupElapsed(next, 500000)).toBe(0)
    const countdown = tickSitWarmup(next, 900000)
    expect(countdown.stepIndex).toBe(1)
    expect(countdown.status).toBe("countdown")
    expect(countdown.countdownEndsAtMs).toBe(905000)
  })

  it("ends each short run automatically and immediately starts walk-back recovery", () => {
    const running = active(runIndex)
    expect(tickSitWarmup(running, 10999).stepIndex).toBe(runIndex)
    const rest = tickSitWarmup(running, 11000)
    expect(rest.stepIndex).toBe(runIndex + 1)
    expect(rest.status).toBe("active")
    expect(rest.startedAtMs).toBe(11000)
  })

  it("automatically prepares the next run after recovery, with a fresh countdown", () => {
    const rest = recovery()
    expect(tickSitWarmup(rest, 70999)).toBe(rest)
    const setup = tickSitWarmup(rest, 71000)
    expect(setup.stepIndex).toBe(runIndex + 2)
    expect(setup.status).toBe("setup")
    expect(getWarmupElapsed(setup, 90000)).toBe(0)
  })

  it("pauses both movement time and automatic progression", () => {
    const paused = pauseSitWarmup(active(), 17000)
    expect(paused.elapsedMs).toBe(12000)
    expect(tickSitWarmup(paused, 900000)).toBe(paused)
    expect(getWarmupElapsed(paused, 900000)).toBe(12000)
    const setup = startSitWarmupStep(paused, 900000)
    const resumed = tickSitWarmup(finishSitWarmupSetup(setup, 908000), 913000)
    expect(getWarmupElapsed(resumed, 915000)).toBe(14000)
  })

  it("pauses setup and countdown without starting work", () => {
    const setup = startSitWarmupStep(createSitWarmup(), 0)
    const pausedSetup = pauseSitWarmup(setup, 1000)
    expect(pausedSetup.status).toBe("paused")
    expect(finishSitWarmupSetup(pausedSetup, 2000)).toBe(pausedSetup)
    const countdown = finishSitWarmupSetup(setup, 10000)
    const paused = pauseSitWarmup(countdown, 13000)
    expect(paused.status).toBe("paused")
    expect(tickSitWarmup(paused, 20000)).toBe(paused)
    expect(startSitWarmupStep(paused, 20000).status).toBe("setup")
  })

  it("pauses at a completed boundary without advancing until resumed", () => {
    const paused = pauseSitWarmup(active(), 200000)
    expect(paused.stepIndex).toBe(0)
    expect(paused.status).toBe("paused")
    expect(paused.elapsedMs).toBe(180000)
    const resumed = startSitWarmupStep(paused, 300000)
    expect(resumed.stepIndex).toBe(1)
    expect(resumed.status).toBe("setup")
  })

  it("resumes recovery immediately and preserves remaining rest", () => {
    const paused = pauseSitWarmup(recovery(), 31000)
    const resumed = startSitWarmupStep(paused, 100000)
    expect(resumed.status).toBe("active")
    expect(getWarmupElapsed(resumed, 100000)).toBe(20000)
    expect(tickSitWarmup(resumed, 139999).stepIndex).toBe(runIndex + 1)
    expect(tickSitWarmup(resumed, 140000).stepIndex).toBe(runIndex + 2)
  })

  it("queues a repeat without shortening recovery, and can undo the repeat", () => {
    const paused = pauseSitWarmup(recovery(), 31000)
    const repeat = repeatSitWarmup(paused)
    expect(repeat.repeatRun).toBe(true)
    expect(repeat.elapsedMs).toBe(20000)
    expect(repeatSitWarmup(repeat).repeatRun).toBe(false)
    const resumed = startSitWarmupStep(repeat, 100000)
    const next = tickSitWarmup(resumed, 140000)
    expect(next.stepIndex).toBe(runIndex)
    expect(next.status).toBe("setup")
    expect(next.repeatRun).toBe(false)
    expect(repeatSitWarmup(active())).toEqual(active())
  })

  it("does not advance beyond the warmup into a timed sprint", () => {
    const last = startSitWarmupStep(createSitWarmup(SIT_WARMUP_STEPS.length - 1), 1000)
    const done = tickSitWarmup(last, 181000)
    expect(done.status).toBe("done")
    expect(tickSitWarmup(done, 900000)).toBe(done)
  })

  it("supports accelerated checks while preserving durations at normal speed", () => {
    const setup = startSitWarmupStep(createSitWarmup(), 0, 10)
    const countdown = finishSitWarmupSetup(setup, 1000, 10)
    expect(countdown.countdownEndsAtMs).toBe(1500)
    const go = tickSitWarmup(countdown, 1500, 10)
    expect(tickSitWarmup(go, 19499, 10).stepIndex).toBe(0)
    expect(tickSitWarmup(go, 19500, 10).stepIndex).toBe(1)
  })

  it("restores timed work paused and interrupted runs at their setup", () => {
    expect(restoreSitWarmup({ ...active(), elapsedMs: 30000 })).toMatchObject({status: "paused", elapsedMs: 30000})
    expect(restoreSitWarmup({ ...active(runIndex), elapsedMs: 3000 })).toMatchObject({status: "paused", stepIndex: runIndex, elapsedMs: 0})
    expect(restoreSitWarmup({ ...createSitWarmup(), stepIndex: 100 })).toMatchObject({stepIndex: 0, status: "paused"})
  })

  it("replaces saved ankle rocks with a fresh pogo set and restarts old distance runs", () => {
    const ankles = restoreSitWarmup({ ...createSitWarmup(4), version: 1, elapsedMs: 5000, status: "active" })
    expect(SIT_WARMUP_STEPS[ankles.stepIndex].id).toBe("pogos")
    expect(ankles).toMatchObject({version: 3, elapsedMs: 0, status: "paused"})
    const oldRun = restoreSitWarmup({ ...createSitWarmup(5), version: 1, elapsedMs: 5000, status: "active" })
    expect(oldRun).toMatchObject({version: 3, stepIndex: runIndex, elapsedMs: 0, status: "paused"})
    const oldCompletedJog = restoreSitWarmup({ ...createSitWarmup(), version: 1, status: "done", elapsedMs: 180000 })
    expect(oldCompletedJog).toMatchObject({stepIndex: 1, elapsedMs: 0, status: "paused"})
    const oldCompletedAnkles = restoreSitWarmup({ ...createSitWarmup(4), version: 1, status: "done", elapsedMs: 30000 })
    expect(oldCompletedAnkles).toMatchObject({stepIndex: runIndex, elapsedMs: 0, status: "paused"})
  })

  it("preserves saved recovery from the manual warmup", () => {
    const rest = restoreSitWarmup({ ...createSitWarmup(6), version: 1, status: "active", elapsedMs: 40000 })
    expect(rest).toMatchObject({stepIndex: runIndex + 1, elapsedMs: 40000, status: "paused"})
    const last = restoreSitWarmup({ ...createSitWarmup(12), version: 1, status: "active", elapsedMs: 120000 })
    expect(last).toMatchObject({stepIndex: SIT_WARMUP_STEPS.length - 1, elapsedMs: 120000, status: "paused"})
  })

  it("does not repeat a completed final recovery from the manual warmup", () => {
    const saved = restoreSitWarmup({ ...createSitWarmup(12), version: 1, status: "done", elapsedMs: 180000 })
    expect(saved.status).toBe("paused")
    expect(startSitWarmupStep(saved, 1000).status).toBe("done")
  })

  it("keeps version-two progress on the same movement after inserting pogos", () => {
    for (let oldIndex = 0; oldIndex < 12; oldIndex += 1) {
      const restored = restoreSitWarmup({ ...createSitWarmup(oldIndex), version: 2, elapsedMs: 3000, status: "active" })
      const currentIndex = oldIndex >= 4 ? oldIndex + 1 : oldIndex
      expect(restored).toMatchObject({
        version: 3, stepIndex: currentIndex, status: "paused",
        elapsedMs: SIT_WARMUP_STEPS[currentIndex].kind === "run" ? 0 : 3000,
      })
    }
    const invalid = restoreSitWarmup({ ...createSitWarmup(12), version: 2 })
    expect(invalid).toMatchObject({stepIndex: 0, status: "paused"})
  })

  it("keeps a queued repeat through a reload", () => {
    const saved = repeatSitWarmup(pauseSitWarmup(recovery(), 31000))
    expect(restoreSitWarmup(saved)).toMatchObject({stepIndex: runIndex + 1, status: "paused", repeatRun: true, elapsedMs: 20000})
  })

  it("distinguishes legacy warmups from saved sprint sessions", () => {
    expect(isLegacySitWarmup("neural-left")).toBe(true)
    expect(isLegacySitWarmup("washout")).toBe(true)
    expect(isLegacySitWarmup("guided-warmup")).toBe(false)
    expect(isLegacySitWarmup("sprint-recovery")).toBe(false)
  })

  it("keeps a visible second on the clock until work is actually complete", () => {
    expect(formatWarmupTime(0.1)).toBe("0:01")
    expect(formatWarmupTime(60)).toBe("1:00")
    expect(formatWarmupTime(-1)).toBe("0:00")
  })
})
