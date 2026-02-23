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
    "Switch legs.",
  "neural-right":
    "Right leg glute bridge. Drive hips up. Squeeze at the top. Near-maximal effort.",
  "washout":
    "Walk at an easy pace for 2 minutes. Then do a flow run at 50% effort for 30 to 60 seconds.",
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

export const WASHOUT_MIDPOINT_CUE =
  "Time for your flow run. Run at 50% effort for 30 to 60 seconds."

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
