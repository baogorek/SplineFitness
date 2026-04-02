export type WorkoutMode = "freeform" | "circuit" | "interval" | "sit" | "coached"
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
  exerciseEquipment?: Record<string, string>
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
  exerciseEquipment?: Record<string, string>
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
  setNotes?: Record<number, string>
  endedEarly?: boolean
}

// Freeform Types
export interface FreeformSetData {
  id: number
  weight: string
  reps: string
}

export interface FreeformExercise {
  id: string
  name: string
  tags: string[]
  sets: FreeformSetData[]
}

export interface FreeformWorkoutSession {
  mode: "freeform"
  startedAt: string
  completedAt?: string
  exercises: FreeformExercise[]
}

export interface FreeformSessionProgress {
  exercises: FreeformExercise[]
  elapsedSeconds: number
  startedAt: string
  savedAt: string
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

// Coached Types
export interface CoachedVideoLink { url: string; label?: string }

export interface CoachedExercise {
  id: string; name: string
  sets?: number; reps?: string; holdSeconds?: number
  durationSeconds?: number; restSeconds?: number; perSide?: boolean
  why?: string; cue?: string; videos?: CoachedVideoLink[]
  note?: string
}

export interface CoachedSuperset {
  id: string; label: string
  exercises: CoachedExercise[]
  rounds: number; restBetweenRoundsSeconds?: number
  instruction?: string
}

export type CoachedPhaseItem =
  | { type: "exercise"; exercise: CoachedExercise }
  | { type: "superset"; superset: CoachedSuperset }

export interface CoachedPhase {
  id: string; name: string; phaseNumber: number
  description?: string
  items: CoachedPhaseItem[]
}

export interface CoachedWorkoutDefinition {
  id: string; name: string; shortName: string
  description: string; phases: CoachedPhase[]
}

export interface CoachedWorkoutSession {
  mode: "coached"
  workoutId: string; workoutName: string
  startedAt: string; completedAt?: string
  totalTimeSeconds: number
  phasesCompleted: string[]
}

// Unified Types
export type WorkoutDefinition = CircuitWorkoutDefinition
export type WorkoutSession = CircuitWorkoutSession | FreeformWorkoutSession | IntervalWorkoutSession | SitWorkoutSession | CoachedWorkoutSession

export interface WorkoutHistoryEntry {
  id: string
  session: WorkoutSession
  completedAt: string
}
