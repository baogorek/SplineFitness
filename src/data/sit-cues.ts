export type SitPhase =
  | "ready"
  | "warmup-countdown"
  | "general-warmup"
  | "tissue-prep-work"
  | "tissue-prep-rest"
  | "neural-left"
  | "neural-switch"
  | "neural-right"
  | "washout"
  | "sprint-ready"
  | "sprint-active"
  | "sprint-recovery"
  | "complete"

export const GENERAL_WARMUP_SECONDS = 120
export const TISSUE_PREP_SETS = 2
export const TISSUE_PREP_WORK_SECONDS = 20
export const TISSUE_PREP_REST_SECONDS = 30
export const NEURAL_HOLD_SECONDS = 30
export const NEURAL_SWITCH_SECONDS = 10
export const WASHOUT_SECONDS = 180

export function computeSprintRecovery(sprintSeconds: number): number {
  return Math.round(Math.max(90, Math.min(240, sprintSeconds * 15)))
}

export const PHASE_LABELS: Record<string, string> = {
  "general-warmup": "Jumping Jacks",
  "tissue-prep-work": "Pogo Hops",
  "tissue-prep-rest": "Rest",
  "neural-left": "Left Leg Glute Bridge",
  "neural-switch": "Switch Legs",
  "neural-right": "Right Leg Glute Bridge",
  "washout": "Active Recovery Walkout",
  "sprint-recovery": "Recovery",
}

export const PHASE_SPEECH_CUES: Record<string, string> = {
  "general-warmup":
    "Jumping jacks. Get the blood flowing and raise your core temperature.",
  "tissue-prep-work":
    "Quick, stiff hops. Minimize ground contact time. Stay on the balls of your feet.",
  "tissue-prep-rest": "Rest.",
  "neural-left":
    "Left leg glute bridge. Drive hips up. Squeeze at the top. Near-maximal effort.",
  "neural-switch":
    "Switch legs. Right leg glute bridge in 10 seconds.",
  "neural-right":
    "Right leg glute bridge. Drive hips up. Squeeze at the top. Near-maximal effort.",
  "washout":
    "Easy walk. Shake out your legs. We've got 3 minutes before sprints.",
}

export const PHASE_TOASTS: Record<string, string> = {
  "general-warmup":
    "General warm-up: elevates core temperature, increases synovial fluid in joints, and prepares the cardiovascular system for high-intensity work.",
  "tissue-prep-work":
    "Tendon stiffness priming: rapid plyometric loading increases rate of force development via the stretch-shortening cycle.",
  "neural-left":
    "Post-activation potentiation: near-maximal glute bridge holds recruit high-threshold motor units, temporarily enhancing explosive output.",
  "washout":
    "Phosphocreatine resynthesis window: 3 minutes of low-intensity movement restores approximately 85% of intramuscular ATP-PCr stores.",
  "sprint-recovery":
    "13-second sprints tap fast glycolysis. Recovery clears H+ ions, restores ATP-PCr, and resets neural drive for quality output.",
}

export interface PhaseCue {
  remainingSeconds: number
  text: string
}

export const PHASE_COACHING_CUES: Partial<Record<SitPhase, PhaseCue[]>> = {
  "general-warmup": [
    { remainingSeconds: 60, text: "One minute down. Keep it going." },
    { remainingSeconds: 30, text: "30 seconds. Keep the pace up." },
    { remainingSeconds: 15, text: "Pogo hops in 15 seconds. No rest." },
  ],
  "tissue-prep-work": [
    { remainingSeconds: 10, text: "10 seconds. Stay light on your feet." },
  ],
  "neural-left": [
    { remainingSeconds: 20, text: "Hold it. Keep squeezing." },
    { remainingSeconds: 15, text: "15 seconds." },
  ],
  "neural-right": [
    { remainingSeconds: 20, text: "Hold it. Keep driving those hips up." },
    { remainingSeconds: 15, text: "15 seconds." },
  ],
  "washout": [
    { remainingSeconds: 150, text: "Nice and easy. Let the ATP stores rebuild." },
    { remainingSeconds: 120, text: "Two minutes to go. Keep walking." },
    { remainingSeconds: 100, text: "Flow run in 10 seconds. Pick it up to about 50% effort." },
    { remainingSeconds: 90, text: "Go. Flow run. Smooth stride, 50% effort." },
    { remainingSeconds: 60, text: "One minute left. Keep the rhythm." },
    { remainingSeconds: 30, text: "Slow to a walk. 30 seconds." },
    { remainingSeconds: 15, text: "Get your mind right. Sprints are next." },
  ],
}

export const NEXT_UP_CUES: Record<string, string> = {
  "tissue-prep-rest->tissue-prep-work": "Pogo hops in 10 seconds.",
  "tissue-prep-rest->neural-left": "Next up: Left leg glute bridge. Near maximal effort.",
  "neural-right->washout": "Next up: Easy walking for 3 minutes.",
}

export function getNextPhaseLabel(phase: SitPhase, tissuePrepSet: number): string | null {
  switch (phase) {
    case "tissue-prep-rest":
      return tissuePrepSet >= TISSUE_PREP_SETS ? "Left Leg Glute Bridge" : "Pogo Hops"
    case "neural-switch":
      return "Right Leg Glute Bridge"
    case "neural-right":
      return "Active Recovery Walkout"
    default:
      return null
  }
}

export interface AtpStage {
  maxSeconds: number
  label: string
  color: string
}

export const ATP_STAGES: AtpStage[] = [
  { maxSeconds: 30, label: "Phosphagen Depleted. Heavy Breathing.", color: "bg-red-500" },
  { maxSeconds: 90, label: "Resynthesizing ATP-PCr (approx 70%)...", color: "bg-orange-500" },
  { maxSeconds: 150, label: "Clearing Metabolic Waste / Restoring CNS...", color: "bg-yellow-500" },
  { maxSeconds: 210, label: "Clearing Metabolic Waste / Restoring CNS...", color: "bg-yellow-500" },
  { maxSeconds: 240, label: "System Reset. Ready for Quality.", color: "bg-lime-500" },
]

export const ATP_FULL_LABEL = "FULL RECHARGE. READY TO SPRINT."
export const ATP_FULL_COLOR = "bg-green-500"
