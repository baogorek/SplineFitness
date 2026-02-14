import {
  WorkoutSession,
  WorkoutHistoryEntry,
  CircuitWorkoutSession,
  IntervalWorkoutSession,
  SitWorkoutSession,
  CircuitSessionProgress,
  ExercisePreference,
  ExerciseSetting,
} from "@/types/workout"
import { supabase } from "./supabase"

const STORAGE_KEYS = {
  CURRENT_SESSION: "strength-tracker:current-session",
  CIRCUIT_PROGRESS: "strength-tracker:circuit-progress",
  EXERCISE_PREFERENCES: "strength-tracker:exercise-preferences",
  EXERCISE_CHOICES: "strength-tracker:exercise-choices",
} as const

export async function getWorkoutHistory(): Promise<WorkoutHistoryEntry[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error("Error fetching workout history:", error)
    return []
  }

  return data.map(row => ({
    id: row.id,
    session: {
      mode: row.mode,
      workoutId: row.workout_id,
      variant: row.variant,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      ...(row.mode === 'circuit' ? { rounds: row.data.rounds } : { exercises: row.data.exercises }),
    } as WorkoutSession,
    completedAt: row.completed_at,
  }))
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<WorkoutHistoryEntry | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const isCircuit = session.mode === 'circuit'
  const isInterval = session.mode === 'interval'
  const isSit = session.mode === 'sit'
  const circuitSession = session as CircuitWorkoutSession

  const sessionData = isCircuit
    ? {
        rounds: circuitSession.rounds,
        exerciseSettings: circuitSession.exerciseSettings,
        exerciseChoices: circuitSession.exerciseChoices,
        weakLinkPractice: circuitSession.weakLinkPractice,
      }
    : isInterval
    ? {
        totalSets: (session as IntervalWorkoutSession).totalSets,
        completedSets: (session as IntervalWorkoutSession).completedSets,
        totalTimeSeconds: (session as IntervalWorkoutSession).totalTimeSeconds,
      }
    : isSit
    ? {
        totalTimeSeconds: (session as SitWorkoutSession).totalTimeSeconds,
        sprintTimes: (session as SitWorkoutSession).sprintTimes,
        bestSprintTimeSeconds: (session as SitWorkoutSession).bestSprintTimeSeconds,
        phasesCompleted: (session as SitWorkoutSession).phasesCompleted,
        endedEarly: (session as SitWorkoutSession).endedEarly,
      }
    : { exercises: (session as any).exercises }

  const workoutId = isInterval ? '4x4-interval'
    : isSit ? 'sit-sprint'
    : (session as CircuitWorkoutSession).workoutId
  const variant = (isInterval || isSit) ? null : (session as CircuitWorkoutSession).variant

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      mode: session.mode,
      workout_id: workoutId,
      variant: variant,
      started_at: session.startedAt,
      completed_at: session.completedAt || new Date().toISOString(),
      data: sessionData,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving workout session:", error)
    return null
  }

  clearCurrentSession()

  return {
    id: data.id,
    session,
    completedAt: data.completed_at,
  }
}

export function saveCurrentSession(session: Partial<WorkoutSession>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
  } catch (error) {
    console.warn("Error saving current session:", error)
  }
}

export function getCurrentSession(): Partial<WorkoutSession> | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearCurrentSession(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
  } catch (error) {
    console.warn("Error clearing current session:", error)
  }
}

export function saveCircuitProgress(progress: CircuitSessionProgress): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CIRCUIT_PROGRESS, JSON.stringify(progress))
}

export function getCircuitProgress(): CircuitSessionProgress | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(STORAGE_KEYS.CIRCUIT_PROGRESS)
  if (!data) return null
  const parsed = JSON.parse(data)
  if (!parsed.exerciseChoices) {
    parsed.exerciseChoices = {}
  }
  return parsed
}

export function clearCircuitProgress(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEYS.CIRCUIT_PROGRESS)
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function getExerciseChoices(): Record<string, "main" | "alternative"> {
  if (typeof window === "undefined") return {}
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXERCISE_CHOICES)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveExerciseChoices(choices: Record<string, "main" | "alternative">): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.EXERCISE_CHOICES, JSON.stringify(choices))
  } catch (error) {
    console.warn("Error saving exercise choices:", error)
  }
}

export async function getExercisePreferences(): Promise<Record<string, ExercisePreference>> {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data, error } = await supabase
      .from('exercise_preferences')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error("Error fetching exercise preferences:", error)
      return getLocalExercisePreferences()
    }

    const prefs: Record<string, ExercisePreference> = {}
    data.forEach(row => {
      prefs[row.exercise_id] = {
        exerciseId: row.exercise_id,
        durationSeconds: row.duration_seconds,
      }
    })
    return prefs
  }

  return getLocalExercisePreferences()
}

export async function saveExercisePreference(
  exerciseId: string,
  pref: Partial<ExercisePreference>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { error } = await supabase
      .from('exercise_preferences')
      .upsert({
        user_id: user.id,
        exercise_id: exerciseId,
        duration_seconds: pref.durationSeconds ?? 60,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,exercise_id',
      })

    if (error) {
      console.error("Error saving exercise preference:", error)
    }
  } else {
    const prefs = getLocalExercisePreferences()
    prefs[exerciseId] = {
      exerciseId,
      durationSeconds: pref.durationSeconds ?? prefs[exerciseId]?.durationSeconds ?? 60,
    }
    saveLocalExercisePreferences(prefs)
  }
}

export async function saveBulkExercisePreferences(
  settings: Record<string, ExerciseSetting>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const rows = Object.entries(settings).map(([exerciseId, setting]) => ({
      user_id: user.id,
      exercise_id: exerciseId,
      duration_seconds: setting.durationSeconds,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('exercise_preferences')
      .upsert(rows, { onConflict: 'user_id,exercise_id' })

    if (error) {
      console.error("Error saving bulk exercise preferences:", error)
    }
  } else {
    const prefs: Record<string, ExercisePreference> = {}
    Object.entries(settings).forEach(([exerciseId, setting]) => {
      prefs[exerciseId] = {
        exerciseId,
        durationSeconds: setting.durationSeconds,
      }
    })
    saveLocalExercisePreferences(prefs)
  }
}

function getLocalExercisePreferences(): Record<string, ExercisePreference> {
  if (typeof window === "undefined") return {}
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXERCISE_PREFERENCES)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveLocalExercisePreferences(prefs: Record<string, ExercisePreference>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.EXERCISE_PREFERENCES, JSON.stringify(prefs))
  } catch (error) {
    console.warn("Error saving exercise preferences:", error)
  }
}
