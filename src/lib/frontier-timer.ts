import { getCurrentFrontierChange, parseDuration } from "@/lib/frontier-utils"
import { FrontierExercise } from "@/types/frontier"

export const FRONTIER_PREP_SECONDS = 5

export interface FrontierTimerState {
  status: "ready" | "running" | "paused" | "finished"
  targetSeconds: number | null
  accumulatedMs: number
  startedAtMs: number | null
}

export function createFrontierTimer(): FrontierTimerState {
  return { status: "ready", targetSeconds: null, accumulatedMs: 0, startedAtMs: null }
}

export function isTimedFrontierExercise(exercise: FrontierExercise): boolean {
  return ["weight-time", "duration-longer", "duration-faster"].includes(exercise.metric)
}

export function getFrontierTimerTarget(exercise: FrontierExercise | null): number | null {
  if (!exercise) return null
  const change = getCurrentFrontierChange(exercise.metric, exercise.changes)
  if (exercise.metric === "freeform") return parseCustomTimedMark(change?.rawValue)?.seconds ?? null
  if (!isTimedFrontierExercise(exercise)) return null
  const value = change?.value
  const seconds = exercise.metric === "weight-time" ? value?.secondary : value?.primary
  return seconds !== undefined && Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

/** Only an explicit trailing duration is safe to time; bare numbers may be reps or loads. */
export function parseCustomTimedMark(rawValue: string | undefined): { prefix: string; seconds: number } | null {
  if (!rawValue) return null
  const match = rawValue.trim().match(/^(?:(.*\/\s*))?([^/]+)$/)
  if (!match || !/[:ms]/i.test(match[2])) return null
  const seconds = parseDuration(match[2].trim())
  return seconds !== null && seconds > 0 ? { prefix: match[1] ?? "", seconds } : null
}

function timelineMs(state: FrontierTimerState, nowMs: number): number {
  return state.accumulatedMs + (state.startedAtMs === null ? 0 : Math.max(0, nowMs - state.startedAtMs))
}

export function startFrontierTimer(targetSeconds: number | null, nowMs: number): FrontierTimerState {
  return {
    status: "running",
    targetSeconds: targetSeconds !== null && Number.isFinite(targetSeconds) && targetSeconds > 0
      ? targetSeconds
      : null,
    accumulatedMs: 0,
    startedAtMs: nowMs,
  }
}

export function pauseFrontierTimer(state: FrontierTimerState, nowMs: number): FrontierTimerState {
  if (state.status !== "running") return state
  return { ...state, status: "paused", accumulatedMs: timelineMs(state, nowMs), startedAtMs: null }
}

export function resumeFrontierTimer(state: FrontierTimerState, nowMs: number): FrontierTimerState {
  if (state.status !== "paused") return state
  return { ...state, status: "running", startedAtMs: nowMs }
}

export function finishFrontierTimer(state: FrontierTimerState, nowMs: number): FrontierTimerState {
  if (state.status !== "running" && state.status !== "paused") return state
  return { ...state, status: "finished", accumulatedMs: timelineMs(state, nowMs), startedAtMs: null }
}

export function getFrontierTimerSnapshot(state: FrontierTimerState, nowMs: number) {
  const elapsedMs = timelineMs(state, nowMs)
  const prepRemainingSeconds = Math.ceil(Math.max(0, FRONTIER_PREP_SECONDS * 1000 - elapsedMs) / 1000)
  const elapsedSeconds = Math.max(0, elapsedMs - FRONTIER_PREP_SECONDS * 1000) / 1000
  const targetReached = state.targetSeconds !== null && elapsedSeconds >= state.targetSeconds
  return {
    prepRemainingSeconds,
    elapsedSeconds,
    targetReached,
    remainingSeconds: state.targetSeconds === null ? 0 : Math.max(0, state.targetSeconds - elapsedSeconds),
    overtimeSeconds: state.targetSeconds === null ? 0 : Math.max(0, elapsedSeconds - state.targetSeconds),
  }
}

export function formatFrontierTimerTime(seconds: number, countdown = false): string {
  const tenths = countdown ? Math.ceil(seconds * 10) : Math.floor(seconds * 10)
  const minutes = Math.floor(tenths / 600)
  const wholeSeconds = Math.floor(tenths / 10) % 60
  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${tenths % 10}`
}
