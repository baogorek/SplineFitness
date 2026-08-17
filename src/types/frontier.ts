export type FrontierMetric =
  | "reps"
  | "weight-time"
  | "duration-longer"
  | "duration-faster"
  | "weight"
  | "speed"
  | "freeform"

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
