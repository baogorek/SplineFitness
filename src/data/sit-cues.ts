export type SitPhase =
  | "ready"
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

export const TISSUE_PREP_SETS = 2
export const TISSUE_PREP_WORK_SECONDS = 20
export const TISSUE_PREP_REST_SECONDS = 30
export const NEURAL_HOLD_SECONDS = 30
export const NEURAL_SWITCH_SECONDS = 10
export const WASHOUT_SECONDS = 240
export const SPRINT_RECOVERY_SECONDS = 240

export const PHASE_LABELS: Record<string, string> = {
  "tissue-prep-work": "Pogo Hops",
  "tissue-prep-rest": "Rest",
  "neural-left": "Left Leg Isometric Hold",
  "neural-switch": "Switch Legs",
  "neural-right": "Right Leg Isometric Hold",
  "washout": "Active Recovery Walkout",
  "sprint-recovery": "Recovery",
}

export const PHASE_SPEECH_CUES: Record<string, string> = {
  "tissue-prep-work":
    "Quick, stiff hops. Minimize ground contact time. Stay on the balls of your feet.",
  "neural-left":
    "Left leg wall sit. Push hard into the wall. Near-maximal effort.",
  "neural-switch":
    "Switch legs. Check your 20-degree knee angle. Drive heel down.",
  "neural-right":
    "Right leg wall sit. Push hard into the wall. Near-maximal effort.",
  "washout":
    "Walk at an easy pace. Keep moving to promote phosphocreatine resynthesis.",
}

export const PHASE_TOASTS: Record<string, string> = {
  "tissue-prep-work":
    "Tendon stiffness priming: rapid plyometric loading increases rate of force development via the stretch-shortening cycle.",
  "neural-left":
    "Post-activation potentiation: near-maximal isometric holds recruit high-threshold motor units, temporarily enhancing explosive output.",
  "washout":
    "Phosphocreatine resynthesis window: 3-4 minutes of low-intensity movement restores approximately 90% of intramuscular ATP-PCr stores.",
  "sprint-recovery":
    "13-second sprints tap fast glycolysis. 4-minute recovery clears H+ ions, restores ATP-PCr, and resets neural drive for quality output.",
}

export const WASHOUT_MIDPOINT_CUE =
  "Two minutes remaining. Keep walking. Phosphocreatine stores approximately 70% resynthesized. Begin mental preparation for sprint efforts."

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
