export type WorkoutMode = "freeform" | "circuit" | "interval" | "sit" | "liss-core" | "vo2max"
export type WorkoutVariant = "A" | "B"
export type SitPhase =
  | "ready"
  | "warmup-countdown"
  | "general-warmup"
  | "post-warmup-shakeout"
  | "tissue-prep-work"
  | "tissue-prep-rest"
  | "adductor-squeeze"
  | "neural-left"
  | "neural-switch"
  | "neural-right"
  | "washout"
  | "sprint-ready"
  | "sprint-active"
  | "sprint-recovery"
  | "complete"

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
  roundTimerRunning?: boolean
  phase?: "ready" | "transition" | "timing" | "input" | "round-complete"
  comboTimerSeconds?: number
  comboTimerRunning?: boolean
  transitionTimerSeconds?: number
  transitionTimerRunning?: boolean
  transitionDuration?: number
  transitionExerciseName?: string
  transitionEquipmentNote?: string
  transitionExerciseDuration?: number
  resumeAfterTransition?: boolean
  isFirstCombo?: boolean
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

export type IntervalPhase = "ready" | "countdown" | "interval" | "complete"

export interface IntervalSessionProgress {
  phase: Exclude<IntervalPhase, "complete">
  currentSet: number
  workoutStarted: boolean
  startedAt: string
  savedAt: string
  workoutTimerSeconds: number
  restTimerSeconds: number
  intervalElapsedSeconds: number
  workoutTimerRunning?: boolean
  restTimerRunning?: boolean
  intervalTimerRunning?: boolean
  currentNote: string
  setNotes: Record<number, string>
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
  timerRunning?: boolean
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

export interface SitSessionProgress {
  phase: SitPhase
  tissuePrepSet: number
  sprintNumber: number
  sprintHistory: SprintRecord[]
  bestTime: number | null
  warmupCountdown: number
  workoutTimerSeconds: number
  phaseTimerElapsedSeconds: number
  workoutTimerRunning?: boolean
  phaseTimerRunning?: boolean
  phasesCompleted: number
  startedAt: string
  savedAt: string
}

// LISS + Core Endurance Types
export type CoreExerciseId = "rotation" | "crunch" | "anti-flexion"
export type CoreDifficulty = "too-easy" | "about-right" | "too-hard"
export type LissCoreStepKind = "work" | "transition" | "reset"
export type LissCoreWorkCategory = "liss" | "abdominal" | "extensor"

export interface LissCoreTemplate {
  lissDurationSeconds: number
  rounds: number
  treadmillTransitionSeconds: number
  betweenExerciseSeconds: number
  betweenRoundSeconds: number
  rotationSideDurationSeconds: number
  crunchDurationSeconds: number
  antiFlexionHoldCount: number
  antiFlexionHoldDurationSeconds: number
  antiFlexionResetSeconds: number
  exerciseOrder: CoreExerciseId[]
}

export interface CableExerciseSetup {
  weight?: number
  pulleyPosition?: string
  attachment?: string
  setupNote?: string
}

export interface LissCoreCableSetup {
  useSideSpecificRotation: boolean
  rotation: CableExerciseSetup
  rotationLeft?: CableExerciseSetup
  rotationRight?: CableExerciseSetup
  crunch: CableExerciseSetup
  antiFlexion: CableExerciseSetup
}

export interface LissCoreStep {
  id: string
  kind: LissCoreStepKind
  label: string
  durationSeconds: number
  exerciseId?: "treadmill" | CoreExerciseId
  substep?: string
  round?: number
  side?: "left" | "right"
  holdNumber?: number
  workCategory?: LissCoreWorkCategory
  transitionType?: "to-circuit" | "between-exercises" | "between-rounds" | "hold-reset"
  instructions?: string
}

export interface LissCoreStepResult {
  stepId: string
  stepIndex: number
  status: "completed" | "skipped"
  elapsedSeconds: number
}

export interface LissCoreWorkoutSession {
  mode: "liss-core"
  startedAt: string
  completedAt?: string
  totalTimeSeconds: number
  template: LissCoreTemplate
  cableSetup: LissCoreCableSetup
  stepResults: LissCoreStepResult[]
  lissSeconds: number
  abdominalSeconds: number
  extensorSeconds: number
  completedIntervals: number
  skippedIntervals: number
  difficultyRatings?: Partial<Record<CoreExerciseId | "overall", CoreDifficulty>>
  notes?: string
  endedEarly: boolean
}

export interface LissCoreSessionProgress {
  phase: "active" | "complete"
  template: LissCoreTemplate
  cableSetup: LissCoreCableSetup
  previousCableSetup: LissCoreCableSetup
  voiceCues: boolean
  startedAt: string
  savedAt: string
  stepIndex: number
  isRunning: boolean
  stepEndAtMs: number | null
  remainingMs: number
  activeElapsedMs: number
  lastTickAtMs: number | null
  stepResults: LissCoreStepResult[]
  endedEarly: boolean
}

// VO2 Max Types
export interface Vo2MaxWorkoutSession {
  mode: "vo2max"
  startedAt: string
  completedAt?: string
  durationSeconds: number
  startOffsetMiles: number
  finalDistanceMiles: number
  testDistanceMiles: number
  testDistanceMeters: number
  vo2Max: number
  mets: number
  averagePaceSecondsPerMile: number
  averageSpeedMph: number
  inclinePercent: number
  notes?: string
  endedEarly: boolean
}

export interface Vo2MaxSessionProgress {
  stage: "timer" | "entry"
  startOffsetInput: string
  resultStartOffsetInput: string
  timerStarted: boolean
  elapsedSeconds: number
  timerRunning: boolean
  startedAt: string
  completedAt: string
  endedEarly: boolean
  finishedDurationSeconds: number
  finalDistanceInput: string
  savedAt: string
}

export interface LegacyProgramWorkoutSession {
  mode: "coached"
  workoutId: string; workoutName: string
  startedAt: string; completedAt?: string
  totalTimeSeconds: number
  phasesCompleted: string[]
}

// Unified Types
export type WorkoutDefinition = CircuitWorkoutDefinition
export type ActiveWorkoutSession =
  | CircuitWorkoutSession
  | FreeformWorkoutSession
  | IntervalWorkoutSession
  | SitWorkoutSession
  | LissCoreWorkoutSession
  | Vo2MaxWorkoutSession
export type WorkoutSession =
  | ActiveWorkoutSession
  | LegacyProgramWorkoutSession

export interface WorkoutHistoryEntry {
  id: string
  session: WorkoutSession
  completedAt: string
}
