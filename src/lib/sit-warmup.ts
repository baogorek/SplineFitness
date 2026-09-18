import { SitPhase, SitWarmupProgress } from "@/types/workout"

export interface SitWarmupStep {
  id: string
  kind: "timed" | "run" | "recovery"
  section: "Easy movement" | "Dynamic movement" | "Progressive runs"
  title: string
  instruction: string
  seconds: number
  startCue: string
  finishCue: string
  effort?: number
  runNumber?: number
}

// Practical adaptation, not the study's exact protocol or an injury-prevention claim.
// van den Tillaar et al. (2025): 8 x 50 m, 60–95%, 60 s between runs,
// dynamic mobility and 3 min before the maximal sprint. The user chose four
// build-ups with optional repeats: https://pubmed.ncbi.nlm.nih.gov/40407439/
export const BUILD_UP_EFFORTS = [60, 70, 80, 90] as const
export const BUILD_UP_DISTANCE_METERS = 50
export const WARMUP_COUNTDOWN_SECONDS = 5

export const SIT_WARMUP_STEPS: SitWarmupStep[] = [
  {
    id: "easy-jog", kind: "timed", section: "Easy movement", title: "Easy jog", seconds: 180,
    instruction: "Jog at a comfortable, conversational pace. Start with walking if needed and ease into the jog.",
    startCue: "Go. Easy jog, comfortable pace.", finishCue: "Easy jog complete. Walk while you get ready for marching.",
  },
  {
    id: "march", kind: "timed", section: "Dynamic movement", title: "March with arm swings", seconds: 30,
    instruction: "Stand tall. Alternate lifting each knee while swinging the opposite arm. Keep it relaxed and controlled.",
    startCue: "Go. March with relaxed arm swings.", finishCue: "Marching complete. Set up for left leg swings.",
  },
  {
    id: "swings-left", kind: "timed", section: "Dynamic movement", title: "Left leg swings", seconds: 20,
    instruction: "Hold a support if needed. Stand on your right leg and gently swing your left leg forward and back within a comfortable range.",
    startCue: "Go. Swing your left leg gently forward and back.", finishCue: "Stop. Set up to swing your right leg.",
  },
  {
    id: "swings-right", kind: "timed", section: "Dynamic movement", title: "Right leg swings", seconds: 20,
    instruction: "Stand on your left leg, using a support if needed. Gently swing your right leg forward and back within a comfortable range.",
    startCue: "Go. Swing your right leg gently forward and back.", finishCue: "Stop. Ankle rocks are next.",
  },
  {
    id: "ankles", kind: "timed", section: "Dynamic movement", title: "Alternating ankle rocks", seconds: 30,
    instruction: "Use a short split stance. Keep the front heel down and gently move that knee over the toes, then switch feet. Keep alternating.",
    startCue: "Go. Ankle rocks, alternating feet.", finishCue: "Dynamic movement complete. Get ready for your first relaxed build-up.",
  },
  ...BUILD_UP_EFFORTS.flatMap((effort, index): SitWarmupStep[] => [
    {
      id: `run-${index + 1}`, kind: "run", section: "Progressive runs", title: `Build-up ${index + 1} of ${BUILD_UP_EFFORTS.length}`,
      seconds: 0, effort, runNumber: index + 1,
      instruction: "Build speed smoothly and stay relaxed. Leave plenty of room to slow down after the run.",
      startCue: `Go. Build smoothly toward ${effort} percent.`, finishCue: "Run finished. Walk back and recover.",
    },
    {
      id: `recovery-${index + 1}`, kind: "recovery", section: "Progressive runs",
      title: index === BUILD_UP_EFFORTS.length - 1 ? "Recover before sprints" : "Walk back and recover",
      seconds: index === BUILD_UP_EFFORTS.length - 1 ? 180 : 60,
      instruction: "Walk easily. Let your breathing settle and your legs feel ready. Take longer if needed; the next run starts only when you choose.",
      startCue: "Walk back and recover.",
      finishCue: index === BUILD_UP_EFFORTS.length - 1
        ? "Recovery guide reached. Continue to sprint setup when you feel ready, or take more time."
        : "One minute of recovery. Continue when you feel ready, or take more time.",
      effort, runNumber: index + 1,
    },
  ]),
]

export function createSitWarmup(stepIndex = 0): SitWarmupProgress {
  return { version: 1, stepIndex, status: "ready", elapsedMs: 0, startedAtMs: null, countdownEndsAtMs: null }
}

export function getWarmupElapsed(state: SitWarmupProgress, nowMs: number, speed = 1): number {
  return state.elapsedMs + (state.status === "active" && state.startedAtMs !== null
    ? Math.max(0, nowMs - state.startedAtMs) * speed : 0)
}

export function startSitWarmupStep(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status !== "ready" && state.status !== "paused") return state
  return { ...state, status: "countdown", countdownEndsAtMs: nowMs + WARMUP_COUNTDOWN_SECONDS * 1000 / speed, startedAtMs: null }
}

/** Start at the delivered Go cue, never retroactively charge delayed setup time. */
export function tickSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status === "countdown" && state.countdownEndsAtMs !== null && nowMs >= state.countdownEndsAtMs) {
    return { ...state, status: "active", startedAtMs: nowMs, countdownEndsAtMs: null }
  }
  const step = SIT_WARMUP_STEPS[state.stepIndex]
  if (state.status === "active" && step.kind === "timed" && getWarmupElapsed(state, nowMs, speed) >= step.seconds * 1000) {
    return { ...state, status: "done", elapsedMs: step.seconds * 1000, startedAtMs: null }
  }
  return state
}

export function pauseSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status === "countdown") {
    return { ...state, status: state.elapsedMs > 0 ? "paused" : "ready", countdownEndsAtMs: null }
  }
  const current = tickSitWarmup(state, nowMs, speed)
  if (current.status !== "active") return current
  return { ...current, status: "paused", elapsedMs: getWarmupElapsed(current, nowMs, speed), startedAtMs: null }
}

export function canAdvanceSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): boolean {
  const step = SIT_WARMUP_STEPS[state.stepIndex]
  return state.status === "done"
    || (state.status === "active" && (step.kind === "run" || (step.kind === "recovery" && getWarmupElapsed(state, nowMs, speed) >= step.seconds * 1000)))
}

export function advanceSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (!canAdvanceSitWarmup(state, nowMs, speed)) return state
  const nextIndex = state.stepIndex + 1
  if (nextIndex >= SIT_WARMUP_STEPS.length) return state
  const next = createSitWarmup(nextIndex)
  // Recovery begins immediately when the user finishes a distance-based run.
  return SIT_WARMUP_STEPS[nextIndex].kind === "recovery" ? { ...next, status: "active", startedAtMs: nowMs } : next
}

export function repeatSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (!canAdvanceSitWarmup(state, nowMs, speed)) return state
  const step = SIT_WARMUP_STEPS[state.stepIndex]
  if (step.kind === "run") return state
  return createSitWarmup(step.kind === "recovery" ? state.stepIndex - 1 : state.stepIndex)
}

/** Reloads pause at the saved action; a partially run build-up starts at setup. */
export function restoreSitWarmup(saved?: SitWarmupProgress): SitWarmupProgress {
  if (!saved || saved.version !== 1 || !Number.isInteger(saved.stepIndex)
    || saved.stepIndex < 0 || saved.stepIndex >= SIT_WARMUP_STEPS.length) return createSitWarmup()
  const step = SIT_WARMUP_STEPS[saved.stepIndex]
  const elapsedMs = Number.isFinite(saved.elapsedMs) ? Math.max(0, saved.elapsedMs) : 0
  if (step.kind === "run") return createSitWarmup(saved.stepIndex)
  return { ...createSitWarmup(saved.stepIndex), elapsedMs,
    status: step.kind === "timed" && elapsedMs >= step.seconds * 1000 ? "done" : elapsedMs > 0 ? "paused" : "ready" }
}

export function isLegacySitWarmup(phase: SitPhase): boolean {
  return !["ready", "complete", "guided-warmup", "sprint-ready", "sprint-active", "sprint-recovery"].includes(phase)
}

export function formatWarmupTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}
