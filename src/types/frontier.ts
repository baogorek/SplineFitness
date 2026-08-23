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
  value?: FrontierValue
  rawValue?: string
  recordedAt?: string
  kind: "progress" | "correction" | "import"
}

export interface FrontierAttempt {
  id: string
  attemptedAt: string
}

export interface FrontierExercise {
  id: string
  name: string
  /** Location-specific station or area. Optional only for cards saved before structured organization. */
  equipment?: string
  /** A simple organizational category, not an anatomical classification. */
  bodyPart?: FrontierBodyPart
  metric: FrontierMetric
  changes: FrontierChange[]
  /** Attempts that did not move the frontier. Successful efforts are represented by changes. */
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
