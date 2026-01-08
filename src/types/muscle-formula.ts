export type MovementPlane = "sagittal" | "frontal" | "transverse"
export type MovementAxis = "frontal" | "sagittal" | "longitudinal"
export type MuscleAction = "concentric" | "eccentric"
export type JointSide = "anterior" | "posterior" | "medial" | "lateral"
export type ResistanceType = "gravity" | "cable" | "elastic" | "machine"
export type ResistanceDirection = "downward" | "upward" | "anterior" | "posterior" | "medial" | "lateral"

export type JointMovement =
  | "hip-extension" | "hip-flexion" | "hip-abduction" | "hip-adduction" | "hip-medial-rotation" | "hip-lateral-rotation"
  | "knee-extension" | "knee-flexion" | "knee-medial-rotation" | "knee-lateral-rotation"
  | "ankle-plantar-flexion" | "ankle-dorsiflexion"
  | "subtalar-inversion" | "subtalar-eversion"
  | "scapula-elevation" | "scapula-depression" | "scapula-retraction" | "scapula-protraction" | "scapula-upward-rotation" | "scapula-downward-rotation"
  | "shoulder-flexion" | "shoulder-extension" | "shoulder-abduction" | "shoulder-adduction" | "shoulder-medial-rotation" | "shoulder-lateral-rotation" | "shoulder-horizontal-flexion" | "shoulder-horizontal-extension"
  | "elbow-flexion" | "elbow-extension"
  | "radioulnar-supination" | "radioulnar-pronation"
  | "wrist-flexion" | "wrist-extension" | "wrist-radial-deviation" | "wrist-ulnar-deviation"
  | "spine-flexion" | "spine-extension" | "spine-lateral-flexion" | "spine-rotation"

export interface JointMuscleMapping {
  joint: string
  movement: JointMovement
  movementLabel: string
  primeMovers: string[]
  assistantMovers: string[]
  plane: MovementPlane
  axis: MovementAxis
}

export interface MuscleEntry {
  id: string
  label: string
  joints: string[]
}

export interface MovementScenario {
  id: string
  exerciseName: string
  phase: "upward" | "downward"
  joint: string
  jointLabel: string
  description: string
  correctAnswers: {
    step1: { joint: string; action: string }
    step2: { resistanceType: ResistanceType; direction: ResistanceDirection }
    step3: MuscleAction
    step4_plane: MovementPlane
    step4_axis: MovementAxis
    step5_shortening: JointSide | null
    step5_lengthening: JointSide | null
    step6_primeMovers: string[]
    step6_assistantMovers: string[]
  }
  explanations: {
    step1: string
    step2: string
    step3: string
    step4: string
    step5: string
    step6: string
  }
}

export interface FormulaStep {
  id: number
  title: string
  questionPrompt: string
  helpText: string
}

export interface Step6ValidationResult {
  status: "success" | "fail"
  mastery?: boolean
  message?: string
  missingPrimes?: string[]
  wrongPicks?: string[]
}

export interface MuscleFormulaQuizState {
  selectedScenarioId: string | null
  currentStep: number
  stepResults: (boolean | null)[]
  answers: {
    step1: { joint: string; action: string } | null
    step2: { resistanceType: ResistanceType; direction: ResistanceDirection } | null
    step3: MuscleAction | null
    step4_plane: MovementPlane | null
    step4_axis: MovementAxis | null
    step5_shortening: JointSide | null
    step5_lengthening: JointSide | null
    step6_muscles: string[]
  }
}
