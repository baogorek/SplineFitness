import { describe, expect, it } from "vitest"
import {
  DEFAULT_LISS_CORE_TEMPLATE,
  buildLissCoreSteps,
  getCableSetupForExercise,
  getLissCoreProgressPercent,
  getPlannedWorkoutSeconds,
  migrateSavedLissCoreTemplate,
  setCableSetupForExercise,
} from "./liss-core"
import { LissCoreCableSetup, LissCoreTemplate } from "@/types/workout"

const previousFactoryDefault: LissCoreTemplate = {
  version: 2,
  blocks: [
    { id: "cardio-1", kind: "cardio", durationSeconds: 10 * 60, transitionAfterSeconds: 30 },
    { id: "rotation-1", kind: "rotation", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "cardio-2", kind: "cardio", durationSeconds: 8 * 60, transitionAfterSeconds: 30 },
    { id: "crunch-1", kind: "crunch", durationSeconds: 4 * 60, transitionAfterSeconds: 30 },
    { id: "cardio-3", kind: "cardio", durationSeconds: 8 * 60, transitionAfterSeconds: 30 },
    { id: "back-extension-1", kind: "back-extension", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "cardio-4", kind: "cardio", durationSeconds: 8 * 60, transitionAfterSeconds: 30 },
    { id: "rotation-2", kind: "rotation", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "crunch-2", kind: "crunch", durationSeconds: 4 * 60, transitionAfterSeconds: 30 },
    { id: "cardio-5", kind: "cardio", durationSeconds: 8 * 60, transitionAfterSeconds: 0 },
  ],
}

describe("LISS + Core factory sequence", () => {
  it("runs two complete core circuits between three cardio intervals", () => {
    expect(DEFAULT_LISS_CORE_TEMPLATE.blocks.map((block) => block.kind)).toEqual([
      "cardio",
      "rotation",
      "crunch",
      "back-extension",
      "cardio",
      "rotation",
      "crunch",
      "back-extension",
      "cardio",
    ])
    expect(DEFAULT_LISS_CORE_TEMPLATE.blocks
      .filter((block) => block.kind === "cardio")
      .map((block) => block.durationSeconds)).toEqual([10 * 60, 16 * 60, 16 * 60])
    expect(getPlannedWorkoutSeconds(DEFAULT_LISS_CORE_TEMPLATE)).toBe(66 * 60 + 10)
  })

  it("alternates rotation starting sides while preserving duration and side setup", () => {
    const rotations = buildLissCoreSteps(DEFAULT_LISS_CORE_TEMPLATE).filter((step) => step.exerciseId === "rotation")
    expect(rotations.map((step) => step.side)).toEqual(["left", "right", "right", "left"])
    expect(rotations.map((step) => step.id)).toEqual(["rotation-1-left", "rotation-1-right", "rotation-2-right", "rotation-2-left"])
    expect(rotations.every((step) => step.durationSeconds === 120)).toBe(true)
    const setup: LissCoreCableSetup = {
      useSideSpecificRotation: true,
      rotation: {},
      rotationLeft: { weight: 20, pulleyHeight: 8 },
      rotationRight: { weight: 25, pulleyHeight: 9 },
      crunch: {},
      backExtension: {},
    }
    expect(getCableSetupForExercise(setup, rotations[2].exerciseId, rotations[2].side)).toEqual(setup.rotationRight)
  })

  it("gives both directions of rotation a timed side change", () => {
    const steps = buildLissCoreSteps(DEFAULT_LISS_CORE_TEMPLATE)
    const switches = steps.flatMap((step, index) => step.transitionType === "switch-sides"
      ? [[steps[index - 1].side, step.durationSeconds, steps[index + 1].side]]
      : [])
    expect(switches).toEqual([["left", 5, "right"], ["right", 5, "left"]])
    expect(steps.at(-1)?.kind).toBe("work")
  })

  it("alternates by rotation occurrence even when blocks are reordered", () => {
    const template = { ...DEFAULT_LISS_CORE_TEMPLATE, blocks: [...DEFAULT_LISS_CORE_TEMPLATE.blocks].reverse() }
    const rotations = buildLissCoreSteps(template).filter((step) => step.exerciseId === "rotation")
    expect(rotations.map((step) => step.id)).toEqual(["rotation-2-left", "rotation-2-right", "rotation-1-right", "rotation-1-left"])
  })

  it("preserves the sequence of an older workout when resumed", () => {
    const steps = buildLissCoreSteps(DEFAULT_LISS_CORE_TEMPLATE, "left-first", true)
    expect(steps.some((step) => step.transitionType === "switch-sides")).toBe(false)
    const rotations = steps.filter((step) => step.exerciseId === "rotation")
    expect(rotations.map((step) => step.side)).toEqual(["left", "right", "left", "right"])
  })

  it("upgrades the previous factory sequence", () => {
    expect(migrateSavedLissCoreTemplate(previousFactoryDefault)).toEqual(DEFAULT_LISS_CORE_TEMPLATE)
  })

  it("preserves a user-customized saved sequence", () => {
    const customized = {
      ...previousFactoryDefault,
      blocks: previousFactoryDefault.blocks.map((block, index) => (
        index === 0 ? { ...block, durationSeconds: 12 * 60 } : { ...block }
      )),
    }

    expect(migrateSavedLissCoreTemplate(customized)).toEqual(customized)
  })

  it("updates only the active side when rotation setups are side-specific", () => {
    const setup: LissCoreCableSetup = {
      useSideSpecificRotation: true,
      rotation: { weight: 20 },
      rotationLeft: { weight: 25 },
      rotationRight: { weight: 30 },
      crunch: { weight: 40 },
      backExtension: { weight: 35 },
    }

    expect(setCableSetupForExercise(setup, "rotation", "right", { weight: 35 })).toEqual({
      ...setup,
      rotationRight: { weight: 35 },
    })
  })
})

describe("whole-workout progress", () => {
  const steps = buildLissCoreSteps(DEFAULT_LISS_CORE_TEMPLATE)

  it("uses the full session and stays continuous at step boundaries", () => {
    expect(getLissCoreProgressPercent(steps, 0, 600_000)).toBe(0)
    expect(getLissCoreProgressPercent(steps, 0, 0)).toBeCloseTo(10 / (66 + 10 / 60) * 100)
    expect(getLissCoreProgressPercent(steps, 1, 30_000)).toBeCloseTo(10 / (66 + 10 / 60) * 100)
    expect(getLissCoreProgressPercent(steps, 1, 15_000)).toBeCloseTo(10.25 / (66 + 10 / 60) * 100)
    expect(getLissCoreProgressPercent(steps, 2, 120_000)).toBeCloseTo(10.5 / (66 + 10 / 60) * 100)
  })

  it("shows half of the workout at 33 minutes and 100 percent at the end", () => {
    const secondCardio = steps.findIndex((step) => step.id === "cardio-2")
    // Cardio 2 starts at 22:05, exactly 11 minutes before the midpoint.
    expect(getLissCoreProgressPercent(steps, secondCardio, 300_000)).toBe(50)
    expect(getLissCoreProgressPercent(steps, steps.length - 1, 0)).toBe(100)
  })

  it("uses a customized duration and reflects skipping, going back, or restarting", () => {
    const customized = buildLissCoreSteps({
      version: 2,
      blocks: [
        { id: "cardio-1", kind: "cardio", durationSeconds: 60, transitionAfterSeconds: 0 },
        { id: "cardio-2", kind: "cardio", durationSeconds: 180, transitionAfterSeconds: 0 },
      ],
    })
    expect(customized[1]).toMatchObject({ kind: "transition", durationSeconds: 5 })
    expect(getLissCoreProgressPercent(customized, 2, 180_000)).toBeCloseTo(65 / 245 * 100)
    expect(getLissCoreProgressPercent(customized, 2, 120_000)).toBeCloseTo(125 / 245 * 100)
    expect(getLissCoreProgressPercent(customized, 0, 60_000)).toBe(0)
    expect(getLissCoreProgressPercent([], 0, 0)).toBe(0)
  })
})
