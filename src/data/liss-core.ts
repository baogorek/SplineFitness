import {
  CableExerciseSetup,
  CardioIntervalSelection,
  CardioModality,
  CoreExerciseId,
  LissCoreBlockKind,
  LissCoreCableSetup,
  LissCoreStep,
  LissCoreTemplate,
  LissCoreTemplateBlock,
} from "@/types/workout"

export const DEFAULT_LISS_CORE_TEMPLATE: LissCoreTemplate = {
  version: 2,
  blocks: [
    { id: "cardio-1", kind: "cardio", durationSeconds: 10 * 60, transitionAfterSeconds: 30 },
    { id: "rotation-1", kind: "rotation", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "crunch-1", kind: "crunch", durationSeconds: 4 * 60, transitionAfterSeconds: 30 },
    { id: "back-extension-1", kind: "back-extension", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "cardio-2", kind: "cardio", durationSeconds: 16 * 60, transitionAfterSeconds: 30 },
    { id: "rotation-2", kind: "rotation", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "crunch-2", kind: "crunch", durationSeconds: 4 * 60, transitionAfterSeconds: 30 },
    { id: "back-extension-2", kind: "back-extension", durationSeconds: 2 * 60, transitionAfterSeconds: 30 },
    { id: "cardio-3", kind: "cardio", durationSeconds: 16 * 60, transitionAfterSeconds: 0 },
  ],
}

const LEGACY_SPLIT_CIRCUIT_TEMPLATE: LissCoreTemplate = {
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

export const CORE_EXERCISE_NAMES: Record<CoreExerciseId, string> = {
  rotation: "Cable Rotation",
  crunch: "Cable Crunch",
  "back-extension": "Cable Back Extension",
}

export const WORK_BLOCK_NAMES: Record<LissCoreBlockKind, string> = {
  cardio: "Cardio",
  ...CORE_EXERCISE_NAMES,
}

export const CARDIO_MODALITY_LABELS: Record<CardioModality, string> = {
  treadmill: "Treadmill",
  elliptical: "Elliptical",
  other: "Other",
}

export const CORE_EXERCISE_INSTRUCTIONS: Record<CoreExerciseId | "cardio", string> = {
  cardio: "Use a treadmill, elliptical, or another cardio modality at a comfortable continuous endurance intensity you can sustain for the full interval.",
  rotation: "Use very light resistance for continuous, controlled torso rotation. Let the arms mainly connect your body to the cable instead of dominating the movement. Choose a load you can sustain for the full 2-minute interval on each side; this is endurance work, not conventional strength loading.",
  crunch: "A kneeling position is preferred. Establish a relatively fixed hip angle and think “ribs toward pelvis.” The primary motion should come from spinal and trunk flexion, not repeated hip hinging. A small amount of hip movement is acceptable, but this should not become a hip-flexion exercise. Use enough resistance that the cable assists your return upward rather than requiring the spinal extensors to lift the torso, while remaining light enough for the full endurance interval.",
  "back-extension": "Use a rope attachment and hold the rope ends behind the head or upper shoulder area with both hands. Establish a stable hip position, then perform very small-ROM spinal extension repetitions against the cable. Emphasize thoracic and trunk extension instead of turning the movement into a hip hinge. Keep the neck approximately neutral so the head travels with the torso rather than cranking into cervical extension. Use very light resistance suitable for continuous endurance work.",
}

function cloneDefaultTemplate(): LissCoreTemplate {
  return {
    version: 2,
    blocks: DEFAULT_LISS_CORE_TEMPLATE.blocks.map((block) => ({ ...block })),
  }
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function isBlockKind(value: unknown): value is LissCoreBlockKind {
  return value === "cardio" || value === "rotation" || value === "crunch" || value === "back-extension"
}

/** Legacy round-based templates intentionally migrate to the new tested factory sequence. */
export function normalizeLissCoreTemplate(template: LissCoreTemplate | null | undefined): LissCoreTemplate {
  if (!template || template.version !== 2 || !Array.isArray(template.blocks) || template.blocks.length === 0) {
    return cloneDefaultTemplate()
  }

  const usedIds = new Set<string>()
  const blocks: LissCoreTemplateBlock[] = []
  template.blocks.forEach((block, index) => {
    if (!block || !isBlockKind(block.kind)) return
    const baseId = typeof block.id === "string" && block.id.trim() ? block.id.trim() : `${block.kind}-${index + 1}`
    let id = baseId
    let suffix = 2
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    usedIds.add(id)

    blocks.push({
      id,
      kind: block.kind,
      durationSeconds: clampInteger(block.durationSeconds, block.kind === "cardio" ? 60 : 10, 4 * 60 * 60),
      transitionAfterSeconds: clampInteger(block.transitionAfterSeconds, 0, 30 * 60),
    })
  })

  return blocks.length > 0 ? { version: 2, blocks } : cloneDefaultTemplate()
}

function templatesMatch(left: LissCoreTemplate, right: LissCoreTemplate): boolean {
  return left.version === right.version
    && left.blocks.length === right.blocks.length
    && left.blocks.every((block, index) => {
      const comparison = right.blocks[index]
      return block.id === comparison.id
        && block.kind === comparison.kind
        && block.durationSeconds === comparison.durationSeconds
        && block.transitionAfterSeconds === comparison.transitionAfterSeconds
    })
}

/** Upgrade only the former factory default; leave user-customized templates untouched. */
export function migrateSavedLissCoreTemplate(template: LissCoreTemplate | null | undefined): LissCoreTemplate {
  const normalized = normalizeLissCoreTemplate(template)
  return templatesMatch(normalized, LEGACY_SPLIT_CIRCUIT_TEMPLATE)
    ? cloneDefaultTemplate()
    : normalized
}

function buildWorkSteps(block: LissCoreTemplateBlock, blockIndex: number, blockCount: number): LissCoreStep[] {
  const shared = { blockId: block.id, blockIndex, blockCount }

  if (block.kind === "cardio") {
    return [{
      id: block.id,
      kind: "work",
      label: "Cardio",
      durationSeconds: block.durationSeconds,
      exerciseId: "cardio",
      workCategory: "cardio",
      instructions: CORE_EXERCISE_INSTRUCTIONS.cardio,
      ...shared,
    }]
  }

  if (block.kind === "rotation") {
    return [
      {
        id: `${block.id}-left`,
        kind: "work",
        label: CORE_EXERCISE_NAMES.rotation,
        durationSeconds: block.durationSeconds,
        exerciseId: "rotation",
        substep: "LEFT SIDE",
        side: "left",
        workCategory: "abdominal",
        instructions: CORE_EXERCISE_INSTRUCTIONS.rotation,
        ...shared,
      },
      {
        id: `${block.id}-right`,
        kind: "work",
        label: CORE_EXERCISE_NAMES.rotation,
        durationSeconds: block.durationSeconds,
        exerciseId: "rotation",
        substep: "RIGHT SIDE",
        side: "right",
        workCategory: "abdominal",
        instructions: CORE_EXERCISE_INSTRUCTIONS.rotation,
        ...shared,
      },
    ]
  }

  return [{
    id: block.id,
    kind: "work",
    label: CORE_EXERCISE_NAMES[block.kind],
    durationSeconds: block.durationSeconds,
    exerciseId: block.kind,
    workCategory: block.kind === "crunch" ? "abdominal" : "extensor",
    instructions: CORE_EXERCISE_INSTRUCTIONS[block.kind],
    ...shared,
  }]
}

export function buildLissCoreSteps(input: LissCoreTemplate): LissCoreStep[] {
  const template = normalizeLissCoreTemplate(input)
  const steps: LissCoreStep[] = []

  template.blocks.forEach((block, blockIndex) => {
    steps.push(...buildWorkSteps(block, blockIndex, template.blocks.length))
    if (blockIndex < template.blocks.length - 1 && block.transitionAfterSeconds > 0) {
      steps.push({
        id: `transition-after-${block.id}`,
        kind: "transition",
        label: "Transition",
        durationSeconds: block.transitionAfterSeconds,
        transitionType: "between-blocks",
        blockId: template.blocks[blockIndex + 1].id,
        blockIndex: blockIndex + 1,
        blockCount: template.blocks.length,
      })
    }
  })

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
  if (!exerciseId || exerciseId === "cardio") return null
  if (exerciseId === "rotation") {
    if (cableSetup.useSideSpecificRotation && side === "left") {
      return cableSetup.rotationLeft ?? cableSetup.rotation
    }
    if (cableSetup.useSideSpecificRotation && side === "right") {
      return cableSetup.rotationRight ?? cableSetup.rotation
    }
    return cableSetup.rotation
  }
  if (exerciseId === "crunch") return cableSetup.crunch
  return cableSetup.backExtension
}

export function setCableSetupForExercise(
  cableSetup: LissCoreCableSetup,
  exerciseId: LissCoreStep["exerciseId"],
  side: LissCoreStep["side"],
  setup: CableExerciseSetup
): LissCoreCableSetup {
  if (!exerciseId || exerciseId === "cardio") return cableSetup
  if (exerciseId === "rotation") {
    if (cableSetup.useSideSpecificRotation && side === "left") {
      return { ...cableSetup, rotationLeft: setup }
    }
    if (cableSetup.useSideSpecificRotation && side === "right") {
      return { ...cableSetup, rotationRight: setup }
    }
    return { ...cableSetup, rotation: setup }
  }
  if (exerciseId === "crunch") return { ...cableSetup, crunch: setup }
  return { ...cableSetup, backExtension: setup }
}

export function formatCableSetup(setup: CableExerciseSetup | null | undefined): string | null {
  if (!setup) return null
  const parts = [
    setup.weight !== undefined ? `${setup.weight} lb` : null,
    setup.pulleyPosition?.trim() ? `Pulley ${setup.pulleyPosition.trim()}` : null,
    setup.attachment?.trim() || null,
  ].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(" · ") : null
}

export function formatCardioSelection(selection?: CardioIntervalSelection): string | null {
  if (!selection?.modality) return null
  if (selection.modality === "other" && selection.otherLabel?.trim()) return selection.otherLabel.trim()
  return CARDIO_MODALITY_LABELS[selection.modality]
}
