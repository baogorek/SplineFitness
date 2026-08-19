import { FrontierBodyPart, FrontierCard, FrontierExercise } from "@/types/frontier"

export const FRONTIER_BODY_PARTS: FrontierBodyPart[] = [
  "Legs",
  "Back",
  "Shoulders",
  "Core",
  "Chest",
  "Arms",
]

export interface FrontierExerciseStructure {
  name: string
  equipment: string | null
  bodyPart: FrontierBodyPart | null
}

const EQUIPMENT_ALIASES: Record<string, string> = {
  mt: "Multitrainer",
  multitrainer: "Multitrainer",
  bw: "Bodyweight",
  bodyweight: "Bodyweight",
  rack: "Rack",
}

export function normalizeFrontierBodyPart(value: string | null | undefined): FrontierBodyPart | null {
  const normalized = value?.trim().toLocaleLowerCase()
  if (!normalized) return null
  return FRONTIER_BODY_PARTS.find((bodyPart) => bodyPart.toLocaleLowerCase() === normalized) ?? null
}

export function normalizeFrontierEquipment(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ")
  return EQUIPMENT_ALIASES[trimmed.toLocaleLowerCase()] ?? trimmed
}

/**
 * Reads the original spreadsheet convention without making the delimited name
 * the source of truth for new records. Exercise names may themselves contain
 * " - "; everything after the recognized body-part segment is retained.
 */
export function parseFrontierExerciseName(name: string): FrontierExerciseStructure | null {
  const segments = name.split(/\s+-\s+/)
  if (segments.length < 3) return null

  const equipment = normalizeFrontierEquipment(segments[0] ?? "")
  const bodyPart = normalizeFrontierBodyPart(segments[1])
  const exerciseName = segments.slice(2).join(" - ").trim()
  if (!equipment || !bodyPart || !exerciseName) return null

  return { name: exerciseName, equipment, bodyPart }
}

export function getFrontierExerciseStructure(
  exercise: Pick<FrontierExercise, "name" | "equipment" | "bodyPart">
): FrontierExerciseStructure {
  const equipment = exercise.equipment
    ? normalizeFrontierEquipment(exercise.equipment)
    : null
  const bodyPart = normalizeFrontierBodyPart(exercise.bodyPart)

  if (equipment && bodyPart) {
    return { name: exercise.name.trim(), equipment, bodyPart }
  }

  return parseFrontierExerciseName(exercise.name) ?? {
    name: exercise.name.trim(),
    equipment,
    bodyPart,
  }
}

export function normalizeFrontierCard(card: FrontierCard): FrontierCard {
  let changed = false
  const exercises = card.exercises.map((exercise) => {
    const structure = getFrontierExerciseStructure(exercise)
    if (
      structure.equipment === exercise.equipment
      && structure.bodyPart === exercise.bodyPart
      && structure.name === exercise.name
    ) {
      return exercise
    }

    changed = true
    return {
      ...exercise,
      name: structure.name,
      ...(structure.equipment ? { equipment: structure.equipment } : {}),
      ...(structure.bodyPart ? { bodyPart: structure.bodyPart } : {}),
    }
  })

  return changed ? { ...card, exercises } : card
}

export function frontierExerciseIdentity(
  exercise: Pick<FrontierExercise, "name" | "equipment" | "bodyPart">
): string {
  const structure = getFrontierExerciseStructure(exercise)
  return [structure.equipment, structure.bodyPart, structure.name]
    .map((value) => value?.trim().toLocaleLowerCase() ?? "")
    .join("\u001f")
}
