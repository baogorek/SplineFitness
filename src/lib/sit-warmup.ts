import { SitPhase, SitWarmupProgress } from "@/types/workout"

export interface SitWarmupStep {
  id: string
  kind: "timed" | "run" | "recovery"
  section: "Easy movement" | "Dynamic movement" | "Progressive runs"
  title: string
  instruction: string
  setupCue: string
  seconds: number
  startCue: string
  intensity?: string
}

// Practical adaptation, not the study's exact protocol or an injury-prevention claim.
// van den Tillaar et al. (2025) used 8 x 50 m, 60–95%, with 60 s between runs:
// https://pubmed.ncbi.nlm.nih.gov/40407439/
// Four short timed build-ups let this warmup run without finish-button taps.
// Six seconds and qualitative cues are practical choices for this user's brief
// sprint efforts, not a duration or dosing protocol established by that study.
export const BUILD_UP_CUES = ["Easy", "Steady", "Brisk", "Fast and relaxed"] as const
export const BUILD_UP_SECONDS = 6
export const POGO_SECONDS = 15
export const WARMUP_COUNTDOWN_SECONDS = 5

export const SIT_WARMUP_STEPS: SitWarmupStep[] = [
  {
    id: "easy-jog", kind: "timed", section: "Easy movement", title: "Easy jog", seconds: 180,
    instruction: "Easy pace. Breathe comfortably.",
    setupCue: "Start with three minutes of easy jogging. Keep a comfortable pace; walk first if needed. I'll guide each change. Wait for the countdown and Go.",
    startCue: "Go. Easy jog.",
  },
  {
    id: "march", kind: "timed", section: "Dynamic movement", title: "March with arm swings", seconds: 30,
    instruction: "Lift one knee. Swing the opposite arm.",
    setupCue: "Jog complete. Get ready to march in place. Stand tall, lift one knee, and swing the opposite arm. Alternate sides, relaxed and controlled. Wait for Go.",
    startCue: "Go. March in place.",
  },
  {
    id: "swings-left", kind: "timed", section: "Dynamic movement", title: "Left leg swings", seconds: 20,
    instruction: "Stand on your right. Swing your left.",
    setupCue: "Stop marching. Hold a support if you need it. Stand on your right leg. Gently swing your left leg forward and back, within a comfortable range. Wait for Go.",
    startCue: "Go. Swing your left leg.",
  },
  {
    id: "swings-right", kind: "timed", section: "Dynamic movement", title: "Right leg swings", seconds: 20,
    instruction: "Stand on your left. Swing your right.",
    setupCue: "Stop and switch sides. Stand on your left leg. Gently swing your right leg forward and back, using support if needed. Wait for Go.",
    startCue: "Go. Swing your right leg.",
  },
  // Easy hops also appeared in the general warmup of this study; its intervention
  // tested additional maximal hops, not whether easy hops should be omitted:
  // https://doi.org/10.1186/s13102-016-0027-z
  // This brief, low-effort set is a practical preparation dose, not a proven
  // performance boost or injury-prevention protocol.
  {
    id: "pogos", kind: "timed", section: "Dynamic movement", title: "Easy pogo hops", seconds: POGO_SECONDS,
    instruction: "Small, quick hops. Land softly.",
    setupCue: `Stop the leg swings. Next, ${POGO_SECONDS} seconds of easy pogo hops. Feet hip-width apart, knees soft. Bounce lightly on both feet, just off the ground. Keep it easy, not high. Wait for Go.`,
    startCue: "Go. Easy hops.",
  },
  ...BUILD_UP_CUES.flatMap((intensity, index): SitWarmupStep[] => [
    {
      id: `run-${index + 1}`, kind: "run", section: "Progressive runs", title: `Build-up ${index + 1} of ${BUILD_UP_CUES.length}`,
      seconds: BUILD_UP_SECONDS, intensity,
      instruction: "Build smoothly. Stay relaxed.",
      setupCue: `${index === 0 ? "Stop hopping. " : ""}Next, build-up ${index + 1}: ${intensity.toLowerCase()}, for ${BUILD_UP_SECONDS} seconds. Check your route, with space to slow down. Pause if you need more time. Wait for Go.`,
      startCue: `Go. ${intensity}.`,
    },
    {
      id: `recovery-${index + 1}`, kind: "recovery", section: "Progressive runs",
      title: index === BUILD_UP_CUES.length - 1 ? "Recover before sprints" : "Walk back",
      seconds: index === BUILD_UP_CUES.length - 1 ? 180 : 60,
      instruction: "Walk back. Let your breathing settle.",
      setupCue: "",
      startCue: index === BUILD_UP_CUES.length - 1
        ? "Ease down to a walk. Recover for three minutes before sprint setup. Pause if you need more time."
        : "Ease down to a walk. Walk back and recover for one minute. Pause if you need more time.",
      intensity,
    },
  ]),
]

export function createSitWarmup(stepIndex = 0): SitWarmupProgress {
  return { version: 3, stepIndex, status: "ready", elapsedMs: 0, startedAtMs: null, countdownEndsAtMs: null, setupEndsAtMs: null, repeatRun: false }
}

export function getWarmupElapsed(state: SitWarmupProgress, nowMs: number, speed = 1): number {
  return state.elapsedMs + (state.status === "active" && state.startedAtMs !== null
    ? Math.max(0, nowMs - state.startedAtMs) * speed : 0)
}

export function getWarmupSetupCue(state: SitWarmupProgress): string {
  const step = SIT_WARMUP_STEPS[state.stepIndex]
  return state.elapsedMs > 0 ? `Get ready to resume ${step.title.toLowerCase()}. Wait for Go.` : step.setupCue
}

export function startSitWarmupStep(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status !== "ready" && state.status !== "paused") return state
  if (state.elapsedMs >= SIT_WARMUP_STEPS[state.stepIndex].seconds * 1000) return advanceSitWarmup(state, nowMs, speed)
  // Recovery resumes immediately; it does not need exercise setup or a Go cue.
  if (SIT_WARMUP_STEPS[state.stepIndex].kind === "recovery") {
    return { ...state, status: "active", startedAtMs: nowMs, countdownEndsAtMs: null, setupEndsAtMs: null }
  }
  // Speech completion normally starts the countdown. This finite fallback also
  // advances if speech is unavailable or the browser never delivers its callback.
  const setupSeconds = Math.max(8, Math.ceil(getWarmupSetupCue(state).split(/\s+/).length / 2) + 4)
  return { ...state, status: "setup", startedAtMs: null, countdownEndsAtMs: null, setupEndsAtMs: nowMs + setupSeconds * 1000 / speed }
}

export function finishSitWarmupSetup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status !== "setup") return state
  return { ...state, status: "countdown", setupEndsAtMs: null, countdownEndsAtMs: nowMs + WARMUP_COUNTDOWN_SECONDS * 1000 / speed }
}

export function advanceSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  const step = SIT_WARMUP_STEPS[state.stepIndex]
  const nextIndex = step.kind === "recovery" && state.repeatRun ? state.stepIndex - 1 : state.stepIndex + 1
  if (nextIndex >= SIT_WARMUP_STEPS.length) {
    return { ...state, status: "done", elapsedMs: step.seconds * 1000, startedAtMs: null, setupEndsAtMs: null, countdownEndsAtMs: null }
  }
  return startSitWarmupStep(createSitWarmup(nextIndex), nowMs, speed)
}

/** Cross one boundary per delivered cue; a late browser tick cannot skip exercises. */
export function tickSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status === "setup" && state.setupEndsAtMs != null && nowMs >= state.setupEndsAtMs) {
    return finishSitWarmupSetup(state, nowMs, speed)
  }
  if (state.status === "countdown" && state.countdownEndsAtMs !== null && nowMs >= state.countdownEndsAtMs) {
    return { ...state, status: "active", startedAtMs: nowMs, countdownEndsAtMs: null }
  }
  const step = SIT_WARMUP_STEPS[state.stepIndex]
  if (state.status === "active" && getWarmupElapsed(state, nowMs, speed) >= step.seconds * 1000) {
    return advanceSitWarmup(state, nowMs, speed)
  }
  return state
}

export function pauseSitWarmup(state: SitWarmupProgress, nowMs: number, speed = 1): SitWarmupProgress {
  if (state.status === "done" || state.status === "paused") return state
  const elapsedMs = Math.min(SIT_WARMUP_STEPS[state.stepIndex].seconds * 1000, getWarmupElapsed(state, nowMs, speed))
  // Pausing never advances or announces another movement, including at a boundary.
  return { ...state, status: "paused", elapsedMs, startedAtMs: null, countdownEndsAtMs: null, setupEndsAtMs: null }
}

/** Queue an optional repeat while paused, preserving the rest still to come. */
export function repeatSitWarmup(state: SitWarmupProgress): SitWarmupProgress {
  if (state.status !== "paused" || SIT_WARMUP_STEPS[state.stepIndex].kind !== "recovery") return state
  return { ...state, repeatRun: !state.repeatRun }
}

/** Reloads stay paused; old distance runs restart under the new timed protocol. */
export function restoreSitWarmup(saved?: SitWarmupProgress): SitWarmupProgress {
  if (!saved || ![1, 2, 3].includes(saved.version) || !Number.isInteger(saved.stepIndex)
    || saved.stepIndex < 0 || saved.stepIndex >= SIT_WARMUP_STEPS.length - (saved.version === 2 ? 1 : 0)) return { ...createSitWarmup(), status: "paused" }
  let index = saved.stepIndex
  // Version 1 used "done" for each individual movement, rather than the whole warmup.
  if (saved.version === 1) {
    if (saved.status === "done") index += 1
    index = Math.min(index, SIT_WARMUP_STEPS.length - 1)
  }
  // Version 2 omitted ankle rocks, before version 3 added pogos in that position.
  if (saved.version === 2 && index >= 4) index += 1
  const step = SIT_WARMUP_STEPS[index]
  // Time spent on the old ankle rocks must not count as time doing pogo hops.
  const restartStep = step.kind === "run" || (saved.version === 1 && (saved.stepIndex === 4 || saved.status === "done"))
  const warmupWasComplete = saved.version === 1 && saved.status === "done" && saved.stepIndex === SIT_WARMUP_STEPS.length - 1
  const elapsedMs = warmupWasComplete ? step.seconds * 1000 : restartStep ? 0 : Math.min(step.seconds * 1000, Number.isFinite(saved.elapsedMs) ? Math.max(0, saved.elapsedMs) : 0)
  return { ...createSitWarmup(index), status: "paused", elapsedMs, repeatRun: step.kind === "recovery" && saved.repeatRun === true }
}

export function isLegacySitWarmup(phase: SitPhase): boolean {
  return !["ready", "complete", "guided-warmup", "sprint-ready", "sprint-active", "sprint-recovery"].includes(phase)
}

export function formatWarmupTime(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}
