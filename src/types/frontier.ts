export type FrontierMetric =
  | "reps"
  | "weight-time"
  | "duration-longer"
  | "duration-faster"
  | "weight"
  | "speed"
  | "freeform"

export type FrontierBodyPart =
  | "Legs"
  | "Back"
  | "Shoulders"
  | "Core"
  | "Chest"
  | "Arms"

export interface FrontierValue {
  primary: number
  secondary?: number
}

export interface FrontierChange {
  id: string
  /** Links a confirmed frontier update to its timed effort. */
  attemptId?: string
  value?: FrontierValue
  rawValue?: string
  recordedAt?: string
  kind: "progress" | "correction" | "import"
}

export interface FrontierAttempt {
  id: string
  attemptedAt: string
  source?: "manual" | "timer"
  elapsedSeconds?: number
  weight?: number
}

export interface FrontierMetricHistory {
  id: string
  metric: FrontierMetric
  changes: FrontierChange[]
  attempts: FrontierAttempt[]
  endedAt: string
}

export interface FrontierEntrySave {
  name: string
  equipment: string
  bodyPart: FrontierBodyPart
  metric: FrontierMetric
  value: FrontierValue | null
  rawValue: string | null
  valueAction: "progress" | "correction" | "unchanged" | "none"
}

export interface FrontierExercise {
  id: string
  name: string
  /** Location-specific station or area. Optional only for cards saved before structured organization. */
  equipment?: string
  /** A simple organizational category, not an anatomical classification. */
  bodyPart?: FrontierBodyPart
  metric: FrontierMetric
  /** Explicit choices must not be replaced by legacy import inference. */
  metricSource?: "user" | "inferred"
  changes: FrontierChange[]
  /** Previous measurement types retain their original units and marks. */
  metricHistory?: FrontierMetricHistory[]
  /** Recorded efforts, including timed efforts that also moved the frontier. */
  attempts?: FrontierAttempt[]
  order: number
  createdAt: string
  updatedAt: string
}

export interface FrontierCard {
  id: string
  name: string
  exercises: FrontierExercise[]
  order: number
  createdAt: string
  updatedAt: string
}
