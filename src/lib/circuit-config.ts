import { circuitWorkouts } from "@/data/circuit-workouts"
import { CircuitWorkoutSession, WorkoutVariant } from "@/types/workout"

const VALID_DURATIONS = [30, 45, 60, 75, 90, 105, 120]
const WEIGHT_OPTIONS = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25]
const LIGHT_WEIGHT_OPTIONS = [2.5, 5, 7.5, 10]
const PLATFORM_OPTIONS = [6, 9, 12, 15, 18, 21, 24]

export type EquipmentConfig = {
  label: string
  defaultValue: string
  options: { value: string; label: string }[]
}

export const EQUIPMENT_EXERCISES: Record<string, EquipmentConfig> = {
  "alt-single-leg-box-squats": {
    label: "Platform height",
    defaultValue: "12 in",
    options: PLATFORM_OPTIONS.map((height) => ({ value: `${height} in`, label: `${height} in` })),
  },
  "one-half-bottomed-out-squats": {
    label: "Add weight",
    defaultValue: "10 lbs",
    options: WEIGHT_OPTIONS.map((weight) => ({ value: `${weight} lbs`, label: `${weight} lbs` })),
  },
  "bw-triceps-extensions": {
    label: "Add weight",
    defaultValue: "10 lbs",
    options: WEIGHT_OPTIONS.map((weight) => ({ value: `${weight} lbs`, label: `${weight} lbs` })),
  },
  "alt-crossover-step-ups": {
    label: "Platform height",
    defaultValue: "12 in",
    options: PLATFORM_OPTIONS.map((height) => ({ value: `${height} in`, label: `${height} in` })),
  },
  "alt-reverse-lunges": {
    label: "Add weight",
    defaultValue: "10 lbs",
    options: WEIGHT_OPTIONS.map((weight) => ({ value: `${weight} lbs`, label: `${weight} lbs` })),
  },
  "alt-bw-side-lateral-raises": {
    label: "Add weight",
    defaultValue: "5 lbs",
    options: LIGHT_WEIGHT_OPTIONS.map((weight) => ({ value: `${weight} lbs`, label: `${weight} lbs` })),
  },
}

const ALTERNATIVE_EXERCISE_IDS = new Set(
  Object.values(circuitWorkouts).flatMap((workout) => (
    workout.combos.flatMap((combo) => (
      combo.subExercises.filter((exercise) => exercise.alternative).map((exercise) => exercise.id)
    ))
  ))
)

export interface CompactCircuitConfig {
  v: WorkoutVariant
  d: number
  s?: Record<string, number>
  c: Record<string, "alternative">
  e?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isWorkoutVariant(value: unknown): value is WorkoutVariant {
  return value === "A" || value === "B"
}

function snapToValidDuration(duration: number): number {
  return VALID_DURATIONS.reduce((closest, validDuration) => (
    Math.abs(validDuration - duration) < Math.abs(closest - duration) ? validDuration : closest
  ))
}

function parseDuration(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? snapToValidDuration(value)
    : null
}

function parseChoices(value: unknown): Record<string, "alternative"> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([exerciseId, choice]) => (
      choice === "alternative" && ALTERNATIVE_EXERCISE_IDS.has(exerciseId)
    ))
  ) as Record<string, "alternative">
}

function parseEquipment(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined
  const equipment: Record<string, string> = {}
  Object.entries(value).forEach(([exerciseId, setting]) => {
    const equipmentConfig = EQUIPMENT_EXERCISES[exerciseId]
    if (
      typeof setting === "string"
      && equipmentConfig?.options.some((option) => option.value === setting)
    ) {
      equipment[exerciseId] = setting
    }
  })
  return Object.keys(equipment).length > 0 ? equipment : undefined
}

function parseExerciseDurations(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined
  const settings: Record<string, number> = {}
  Object.entries(value).forEach(([exerciseId, duration]) => {
    const parsedDuration = parseDuration(duration)
    if (parsedDuration !== null) settings[exerciseId] = parsedDuration
  })
  return Object.keys(settings).length > 0 ? settings : undefined
}

function mostCommonDuration(durations: number[]): number {
  const durationCounts = new Map<number, number>()
  durations.forEach((duration) => {
    durationCounts.set(duration, (durationCounts.get(duration) || 0) + 1)
  })

  let mostCommon = 60
  let maxCount = 0
  durationCounts.forEach((count, duration) => {
    if (count > maxCount) {
      maxCount = count
      mostCommon = duration
    }
  })
  return mostCommon
}

function parseCompactConfig(value: unknown): CompactCircuitConfig | null {
  if (!isRecord(value) || !isWorkoutVariant(value.v)) return null
  const duration = parseDuration(value.d)
  if (duration === null) return null
  return {
    v: value.v,
    d: duration,
    s: parseExerciseDurations(value.s),
    c: parseChoices(value.c),
    e: parseEquipment(value.e),
  }
}

function parseFullSession(value: unknown): CompactCircuitConfig | null {
  if (!isRecord(value) || value.mode !== "circuit" || !isWorkoutVariant(value.variant)) {
    return null
  }

  const settings = isRecord(value.exerciseSettings) ? value.exerciseSettings : {}
  const exerciseDurations: Record<string, number> = {}
  Object.entries(settings).forEach(([exerciseId, setting]) => {
    const duration = isRecord(setting) ? parseDuration(setting.durationSeconds) : null
    if (duration !== null) exerciseDurations[exerciseId] = duration
  })

  return {
    v: value.variant,
    d: mostCommonDuration(Object.values(exerciseDurations)),
    s: Object.keys(exerciseDurations).length > 0 ? exerciseDurations : undefined,
    c: parseChoices(value.exerciseChoices),
    e: parseEquipment(value.exerciseEquipment),
  }
}

export function parseCircuitConfig(input: string): CompactCircuitConfig | null {
  const trimmed = input.trim()

  const configMatch = trimmed.match(/Config:\s*(\{.*\})/)
  if (configMatch) {
    try {
      const config = parseCompactConfig(JSON.parse(configMatch[1]))
      if (config) return config
    } catch { /* not valid JSON */ }
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)
    return parseCompactConfig(parsed) ?? parseFullSession(parsed)
  } catch { /* not valid JSON */ }

  return null
}

export function buildCircuitCompactConfig(session: CircuitWorkoutSession): string {
  const durations = Object.values(session.exerciseSettings || {}).map(
    (setting) => setting.durationSeconds
  )
  const commonDuration = mostCommonDuration(durations)
  const choices: Record<string, "alternative"> = {}
  Object.entries(session.exerciseChoices || {}).forEach(([exerciseId, choice]) => {
    if (choice === "alternative") choices[exerciseId] = "alternative"
  })

  const config: CompactCircuitConfig = {
    v: session.variant,
    d: commonDuration,
    c: choices,
  }
  const durationOverrides = Object.fromEntries(
    Object.entries(session.exerciseSettings || {})
      .filter(([, setting]) => setting.durationSeconds !== commonDuration)
      .map(([exerciseId, setting]) => [exerciseId, setting.durationSeconds])
  )
  if (Object.keys(durationOverrides).length > 0) config.s = durationOverrides
  if (session.exerciseEquipment && Object.keys(session.exerciseEquipment).length > 0) {
    config.e = session.exerciseEquipment
  }
  return JSON.stringify(config)
}
