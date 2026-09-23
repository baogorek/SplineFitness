import { describe, expect, it } from "vitest"
import {
  DEFAULT_LISS_CORE_TEMPLATE,
  buildLissCoreSteps,
  getCableSetupForExercise,
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
    expect(getPlannedWorkoutSeconds(DEFAULT_LISS_CORE_TEMPLATE)).toBe(66 * 60)
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

  it("alternates by rotation occurrence even when blocks are reordered", () => {
    const template = { ...DEFAULT_LISS_CORE_TEMPLATE, blocks: [...DEFAULT_LISS_CORE_TEMPLATE.blocks].reverse() }
    const rotations = buildLissCoreSteps(template).filter((step) => step.exerciseId === "rotation")
    expect(rotations.map((step) => step.id)).toEqual(["rotation-2-left", "rotation-2-right", "rotation-1-right", "rotation-1-left"])
  })

  it("preserves the sequence of an older workout when resumed", () => {
    const rotations = buildLissCoreSteps(DEFAULT_LISS_CORE_TEMPLATE, "left-first").filter((step) => step.exerciseId === "rotation")
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
