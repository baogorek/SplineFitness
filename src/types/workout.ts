export type WorkoutMode = "traditional" | "circuit" | "interval" | "sit"
export type WorkoutVariant = "A" | "B"

// Circuit Types
export interface VideoLink {
  url: string
  label?: string
}

export interface SubExerciseAlternative {
  id: string
  name: string
  videos?: VideoLink[]
}

export interface SubExercise {
  id: string
  name: string
  order: number
  prepTimeSeconds?: number
  videos?: VideoLink[]
  alternative?: SubExerciseAlternative
  defaultChoice?: "main" | "alternative"
}

export interface ExercisePreference {
  exerciseId: string
  durationSeconds: number
}

export interface ExerciseSetting {
  durationSeconds: number
}

export interface ComboCompletionResult {
  comboId: string
  completedWithoutStopping: boolean
  weakLinkExerciseId?: string
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
  exerciseChoices?: Record<string, "main" | "alternative">
  weakLinkPractice?: WeakLinkPractice[]
}

export interface CircuitSessionProgress {
  variant: WorkoutVariant
  exerciseSettings: Record<string, ExerciseSetting>
  exerciseChoices: Record<string, "main" | "alternative">
  currentRound: number
  currentComboIndex: number
  rounds: CircuitRoundData[]
  currentRoundResults: ComboCompletionResult[]
  weakLinks: WeakLinkEntry[]
  roundTimerSeconds: number
  startedAt: string
  savedAt: string
}

// Interval Types
export interface IntervalSpeechCue {
  elapsedSeconds: number
  text: string
}

export interface IntervalWorkoutSession {
  mode: "interval"
  startedAt: string
  completedAt?: string
  totalSets: number
  completedSets: number
  totalTimeSeconds: number
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

// SIT Types
export interface SprintRecord {
  sprintNumber: number
  timeSeconds: number
}

export interface SitWorkoutSession {
  mode: "sit"
  startedAt: string
  completedAt?: string
  totalTimeSeconds: number
  sprintTimes: SprintRecord[]
  bestSprintTimeSeconds: number | null
  phasesCompleted: number
  endedEarly: boolean
}

// Unified Types
export type WorkoutDefinition = CircuitWorkoutDefinition | TraditionalWorkoutDefinition
export type WorkoutSession = CircuitWorkoutSession | TraditionalWorkoutSession | IntervalWorkoutSession | SitWorkoutSession

export interface WorkoutHistoryEntry {
  id: string
  session: WorkoutSession
  completedAt: string
}
