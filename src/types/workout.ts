export type WorkoutMode = "traditional" | "circuit"
export type WorkoutVariant = "A" | "B"
export type ExerciseVariation = "easy" | "standard" | "advanced"

// Circuit Types
export interface SubExercise {
  id: string
  name: string
  order: number
}

export interface ExercisePreference {
  exerciseId: string
  durationSeconds: number
  defaultVariation: ExerciseVariation
}

export interface ExerciseSetting {
  durationSeconds: number
  variation: ExerciseVariation
}

export interface ComboCompletionResult {
  comboId: string
  completedWithoutStopping: boolean
  weakLinkExerciseId?: string
  exerciseVariations: Record<string, ExerciseVariation>
}

export interface WeakLinkEntry {
  exerciseId: string
  exerciseName: string
  comboId: string
  round: number
}

export interface WeakLinkPractice {
  exerciseId: string
  exerciseName: string
  practiceTimeSeconds: number
  practicedAt: string
}

export interface Combo {
  id: string
  category: string
  subExercises: SubExercise[]
  durationSeconds: number
}

export interface ComboLoadMetrics {
  comboId: string
  round: number
  subExerciseLoads: Record<string, number>
}

export interface CircuitRoundData {
  round: number
  totalTimeSeconds: number
  comboResults: ComboCompletionResult[]
  completedAt?: string
}

export interface CircuitWorkoutDefinition {
  id: string
  variant: WorkoutVariant
  name: string
  combos: Combo[]
}

export interface CircuitWorkoutSession {
  mode: "circuit"
  workoutId: string
  variant: WorkoutVariant
  startedAt: string
  completedAt?: string
  rounds: CircuitRoundData[]
  exerciseSettings?: Record<string, ExerciseSetting>
  weakLinkPractice?: WeakLinkPractice[]
}

// Traditional Types
export interface TraditionalSetData {
  id: number
  weight: string
  reps: string
  rpe: string
}

export interface TraditionalExercise {
  id: string
  name: string
  muscleGroup: string
  prescribedSets: number
  prescribedReps: number
  restPeriod: string
  sets: TraditionalSetData[]
}

export interface TraditionalWorkoutDefinition {
  id: string
  variant: WorkoutVariant
  name: string
  exercises: TraditionalExercise[]
}

export interface TraditionalWorkoutSession {
  mode: "traditional"
  workoutId: string
  variant: WorkoutVariant
  startedAt: string
  completedAt?: string
  exercises: TraditionalExercise[]
}

// Unified Types
export type WorkoutDefinition = CircuitWorkoutDefinition | TraditionalWorkoutDefinition
export type WorkoutSession = CircuitWorkoutSession | TraditionalWorkoutSession

export interface WorkoutHistoryEntry {
  id: string
  session: WorkoutSession
  completedAt: string
}
