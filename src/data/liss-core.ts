import {
  CableExerciseSetup,
  CoreExerciseId,
  LissCoreCableSetup,
  LissCoreStep,
  LissCoreTemplate,
} from "@/types/workout"

export const DEFAULT_LISS_CORE_TEMPLATE: LissCoreTemplate = {
  lissDurationSeconds: 30 * 60,
  rounds: 2,
  treadmillTransitionSeconds: 60,
  betweenExerciseSeconds: 30,
  betweenRoundSeconds: 60,
  rotationSideDurationSeconds: 2 * 60,
  crunchDurationSeconds: 4 * 60,
  antiFlexionHoldCount: 2,
  antiFlexionHoldDurationSeconds: 60,
  antiFlexionResetSeconds: 15,
  exerciseOrder: ["rotation", "crunch", "anti-flexion"],
}

export const CORE_EXERCISE_NAMES: Record<CoreExerciseId, string> = {
  rotation: "Cable Rotation",
  crunch: "Cable Crunch",
  "anti-flexion": "Cable Anti-Flexion",
}

export const CORE_EXERCISE_INSTRUCTIONS: Record<CoreExerciseId | "treadmill", string> = {
  treadmill: "Jog or walk continuously at a comfortable LISS intensity you can sustain for the full interval.",
  rotation: "Keep the movement controlled and rotate through the trunk. Use a light resistance you can sustain continuously.",
  crunch: "Use a high cable, preferably with a rope. Bring your ribs toward your pelvis instead of only hinging at the hips.",
  "anti-flexion": "Cable in front, attachment at upper chest. Maintain an upright trunk against the forward pull. No intentional movement.",
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function normalizeLissCoreTemplate(template: LissCoreTemplate): LissCoreTemplate {
  const uniqueOrder = template.exerciseOrder.filter(
    (exercise, index, order) =>
      ["rotation", "crunch", "anti-flexion"].includes(exercise) && order.indexOf(exercise) === index
  )
  const missingExercises = DEFAULT_LISS_CORE_TEMPLATE.exerciseOrder.filter(
    (exercise) => !uniqueOrder.includes(exercise)
  )

  return {
    lissDurationSeconds: clampInteger(template.lissDurationSeconds, 60, 4 * 60 * 60),
    rounds: clampInteger(template.rounds, 1, 10),
    treadmillTransitionSeconds: clampInteger(template.treadmillTransitionSeconds, 0, 30 * 60),
    betweenExerciseSeconds: clampInteger(template.betweenExerciseSeconds, 0, 10 * 60),
    betweenRoundSeconds: clampInteger(template.betweenRoundSeconds, 0, 30 * 60),
    rotationSideDurationSeconds: clampInteger(template.rotationSideDurationSeconds, 10, 30 * 60),
    crunchDurationSeconds: clampInteger(template.crunchDurationSeconds, 10, 30 * 60),
    antiFlexionHoldCount: clampInteger(template.antiFlexionHoldCount, 1, 10),
    antiFlexionHoldDurationSeconds: clampInteger(template.antiFlexionHoldDurationSeconds, 10, 10 * 60),
    antiFlexionResetSeconds: clampInteger(template.antiFlexionResetSeconds, 0, 5 * 60),
    exerciseOrder: [...uniqueOrder, ...missingExercises],
  }
}

function buildExerciseSteps(
  exerciseId: CoreExerciseId,
  round: number,
  template: LissCoreTemplate
): LissCoreStep[] {
  if (exerciseId === "rotation") {
    return [
      {
        id: `round-${round}-rotation-left`,
        kind: "work",
        label: CORE_EXERCISE_NAMES.rotation,
        durationSeconds: template.rotationSideDurationSeconds,
        exerciseId,
        substep: "LEFT SIDE",
        side: "left",
        round,
        workCategory: "abdominal",
        instructions: CORE_EXERCISE_INSTRUCTIONS.rotation,
      },
      {
        id: `round-${round}-rotation-right`,
        kind: "work",
        label: CORE_EXERCISE_NAMES.rotation,
        durationSeconds: template.rotationSideDurationSeconds,
        exerciseId,
        substep: "RIGHT SIDE",
        side: "right",
        round,
        workCategory: "abdominal",
        instructions: CORE_EXERCISE_INSTRUCTIONS.rotation,
      },
    ]
  }

  if (exerciseId === "crunch") {
    return [{
      id: `round-${round}-crunch`,
      kind: "work",
      label: CORE_EXERCISE_NAMES.crunch,
      durationSeconds: template.crunchDurationSeconds,
      exerciseId,
      round,
      workCategory: "abdominal",
      instructions: CORE_EXERCISE_INSTRUCTIONS.crunch,
    }]
  }

  const steps: LissCoreStep[] = []
  for (let hold = 1; hold <= template.antiFlexionHoldCount; hold += 1) {
    steps.push({
      id: `round-${round}-anti-flexion-hold-${hold}`,
      kind: "work",
      label: CORE_EXERCISE_NAMES["anti-flexion"],
      durationSeconds: template.antiFlexionHoldDurationSeconds,
      exerciseId,
      substep: `HOLD ${hold} OF ${template.antiFlexionHoldCount}`,
      holdNumber: hold,
      round,
      workCategory: "extensor",
      instructions: CORE_EXERCISE_INSTRUCTIONS["anti-flexion"],
    })

    if (hold < template.antiFlexionHoldCount && template.antiFlexionResetSeconds > 0) {
      steps.push({
        id: `round-${round}-anti-flexion-reset-${hold}`,
        kind: "reset",
        label: "Reset",
        durationSeconds: template.antiFlexionResetSeconds,
        exerciseId,
        substep: `NEXT: HOLD ${hold + 1} OF ${template.antiFlexionHoldCount}`,
        round,
        transitionType: "hold-reset",
      })
    }
  }
  return steps
}

export function buildLissCoreSteps(input: LissCoreTemplate): LissCoreStep[] {
  const template = normalizeLissCoreTemplate(input)
  const steps: LissCoreStep[] = [{
    id: "treadmill-liss",
    kind: "work",
    label: "Treadmill LISS",
    durationSeconds: template.lissDurationSeconds,
    exerciseId: "treadmill",
    workCategory: "liss",
    instructions: CORE_EXERCISE_INSTRUCTIONS.treadmill,
  }]

  if (template.treadmillTransitionSeconds > 0) {
    steps.push({
      id: "transition-to-circuit",
      kind: "transition",
      label: "Move to Cable Station",
      durationSeconds: template.treadmillTransitionSeconds,
      round: 1,
      transitionType: "to-circuit",
    })
  }

  for (let round = 1; round <= template.rounds; round += 1) {
    template.exerciseOrder.forEach((exerciseId, exerciseIndex) => {
      steps.push(...buildExerciseSteps(exerciseId, round, template))

      const hasAnotherExercise = exerciseIndex < template.exerciseOrder.length - 1
      if (hasAnotherExercise && template.betweenExerciseSeconds > 0) {
        steps.push({
          id: `round-${round}-transition-${exerciseId}`,
          kind: "transition",
          label: "Transition",
          durationSeconds: template.betweenExerciseSeconds,
          round,
          transitionType: "between-exercises",
        })
      }
    })

    if (round < template.rounds && template.betweenRoundSeconds > 0) {
      steps.push({
        id: `round-${round}-to-round-${round + 1}`,
        kind: "transition",
        label: "Round Transition",
        durationSeconds: template.betweenRoundSeconds,
        round: round + 1,
        substep: `ROUND ${round + 1} OF ${template.rounds}`,
        transitionType: "between-rounds",
      })
    }
  }

  return steps
}

export function getNextWorkStep(steps: LissCoreStep[], currentIndex: number): LissCoreStep | null {
  return steps.slice(currentIndex + 1).find((step) => step.kind === "work") ?? null
}

export function getPlannedWorkoutSeconds(template: LissCoreTemplate): number {
  return buildLissCoreSteps(template).reduce((total, step) => total + step.durationSeconds, 0)
}

export function getCableSetupForExercise(
  cableSetup: LissCoreCableSetup,
  exerciseId?: LissCoreStep["exerciseId"],
  side?: LissCoreStep["side"]
): CableExerciseSetup | null {
  if (!exerciseId || exerciseId === "treadmill") return null
  if (exerciseId === "rotation") {
    if (cableSetup.useSideSpecificRotation && side === "left") {
      return cableSetup.rotationLeft ?? cableSetup.rotation
    }
    if (cableSetup.useSideSpecificRotation && side === "right") {
      return cableSetup.rotationRight ?? cableSetup.rotation
    }
    return cableSetup.rotation
  }
  return exerciseId === "crunch" ? cableSetup.crunch : cableSetup.antiFlexion
}

export function formatCableSetup(setup: CableExerciseSetup | null): string | null {
  if (!setup) return null
  const parts = [
    setup.weight !== undefined ? `${setup.weight} lb` : null,
    setup.pulleyPosition?.trim() ? `Pulley ${setup.pulleyPosition.trim()}` : null,
    setup.attachment?.trim() || null,
  ].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(" · ") : null
}
