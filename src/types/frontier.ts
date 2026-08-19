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

export interface FrontierExercise {
  id: string
  name: string
  /** Location-specific station name. Optional only for cards saved before structured organization. */
  equipment?: string
  /** A simple organizational category, not an anatomical classification. */
  bodyPart?: FrontierBodyPart
  metric: FrontierMetric
  changes: FrontierChange[]
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
