import {
  WorkoutSession,
  WorkoutHistoryEntry,
  CircuitWorkoutSession,
  IntervalSessionProgress,
  SitSessionProgress,
  CircuitSessionProgress,
  FreeformSessionProgress,
  ExercisePreference,
  ExerciseSetting,
} from "@/types/workout"
import { supabase } from "./supabase"

const STORAGE_KEYS = {
  CURRENT_SESSION: "strength-tracker:current-session",
  INTERVAL_PROGRESS: "strength-tracker:interval-progress",
  SIT_PROGRESS: "strength-tracker:sit-progress",
  CIRCUIT_PROGRESS: "strength-tracker:circuit-progress",
  FREEFORM_PROGRESS: "strength-tracker:freeform-progress",
  EXERCISE_PREFERENCES: "strength-tracker:exercise-preferences",
  EXERCISE_CHOICES: "strength-tracker:exercise-choices",
  EXERCISE_EQUIPMENT: "strength-tracker:exercise-equipment",
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

  return data.map(row => {
    const base = {
      mode: row.mode,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }
    let sessionData: Record<string, unknown>
    switch (row.mode) {
      case 'circuit':
        sessionData = {
          workoutId: row.workout_id,
          variant: row.variant,
          rounds: row.data.rounds,
          exerciseSettings: row.data.exerciseSettings,
          exerciseChoices: row.data.exerciseChoices,
          weakLinkPractice: row.data.weakLinkPractice,
        }
        break
      case 'interval':
        sessionData = {
          totalSets: row.data.totalSets,
          completedSets: row.data.completedSets,
          totalTimeSeconds: row.data.totalTimeSeconds,
          setNotes: row.data.setNotes,
          endedEarly: row.data.endedEarly,
        }
        break
      case 'sit':
        sessionData = {
          totalTimeSeconds: row.data.totalTimeSeconds,
          sprintTimes: row.data.sprintTimes,
          bestSprintTimeSeconds: row.data.bestSprintTimeSeconds,
          phasesCompleted: row.data.phasesCompleted,
          endedEarly: row.data.endedEarly,
        }
        break
      case 'vo2max':
        sessionData = {
          durationSeconds: row.data.durationSeconds,
          startOffsetMiles: row.data.startOffsetMiles,
          finalDistanceMiles: row.data.finalDistanceMiles,
          testDistanceMiles: row.data.testDistanceMiles,
          testDistanceMeters: row.data.testDistanceMeters,
          vo2Max: row.data.vo2Max,
          mets: row.data.mets,
          averagePaceSecondsPerMile: row.data.averagePaceSecondsPerMile,
          averageSpeedMph: row.data.averageSpeedMph,
          inclinePercent: row.data.inclinePercent,
          notes: row.data.notes,
          endedEarly: row.data.endedEarly,
        }
        break
      case 'coached':
        sessionData = {
          workoutId: row.workout_id,
          workoutName: row.data.workoutName,
          totalTimeSeconds: row.data.totalTimeSeconds,
          phasesCompleted: row.data.phasesCompleted,
        }
        break
      case 'freeform':
        sessionData = {
          exercises: row.data.exercises,
        }
        break
      default:
        sessionData = {
          workoutId: row.workout_id,
          variant: row.variant,
          exercises: row.data.exercises,
        }
    }
    return {
      id: row.id,
      session: { ...base, ...sessionData } as WorkoutSession,
      completedAt: row.completed_at,
    }
  })
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<WorkoutHistoryEntry | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let sessionData: Record<string, unknown>
  let workoutId: string
  let variant: CircuitWorkoutSession["variant"] | null = null

  switch (session.mode) {
    case "freeform":
      sessionData = { exercises: session.exercises }
      workoutId = "freeform"
      break
    case "circuit":
      sessionData = {
        rounds: session.rounds,
        exerciseSettings: session.exerciseSettings,
        exerciseChoices: session.exerciseChoices,
        weakLinkPractice: session.weakLinkPractice,
      }
      workoutId = session.workoutId
      variant = session.variant
      break
    case "interval":
      sessionData = {
        totalSets: session.totalSets,
        completedSets: session.completedSets,
        totalTimeSeconds: session.totalTimeSeconds,
        setNotes: session.setNotes,
        endedEarly: session.endedEarly,
      }
      workoutId = "4x4-interval"
      break
    case "sit":
      sessionData = {
        totalTimeSeconds: session.totalTimeSeconds,
        sprintTimes: session.sprintTimes,
        bestSprintTimeSeconds: session.bestSprintTimeSeconds,
        phasesCompleted: session.phasesCompleted,
        endedEarly: session.endedEarly,
      }
      workoutId = "sit-sprint"
      break
    case "vo2max":
      sessionData = {
        durationSeconds: session.durationSeconds,
        startOffsetMiles: session.startOffsetMiles,
        finalDistanceMiles: session.finalDistanceMiles,
        testDistanceMiles: session.testDistanceMiles,
        testDistanceMeters: session.testDistanceMeters,
        vo2Max: session.vo2Max,
        mets: session.mets,
        averagePaceSecondsPerMile: session.averagePaceSecondsPerMile,
        averageSpeedMph: session.averageSpeedMph,
        inclinePercent: session.inclinePercent,
        notes: session.notes,
        endedEarly: session.endedEarly,
      }
      workoutId = "vo2max-cooper"
      break
    case "coached":
      sessionData = {
        totalTimeSeconds: session.totalTimeSeconds,
        phasesCompleted: session.phasesCompleted,
        workoutName: session.workoutName,
      }
      workoutId = session.workoutId
      break
  }

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

export function saveIntervalProgress(progress: IntervalSessionProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVAL_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn("Error saving interval progress:", error)
  }
}

export function getIntervalProgress(): IntervalSessionProgress | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INTERVAL_PROGRESS)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearIntervalProgress(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.INTERVAL_PROGRESS)
  } catch (error) {
    console.warn("Error clearing interval progress:", error)
  }
}

export function saveSitProgress(progress: SitSessionProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.SIT_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn("Error saving SIT progress:", error)
  }
}

export function getSitProgress(): SitSessionProgress | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SIT_PROGRESS)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearSitProgress(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.SIT_PROGRESS)
  } catch (error) {
    console.warn("Error clearing SIT progress:", error)
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

export function saveFreeformProgress(progress: FreeformSessionProgress): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.FREEFORM_PROGRESS, JSON.stringify(progress))
}

export function getFreeformProgress(): FreeformSessionProgress | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(STORAGE_KEYS.FREEFORM_PROGRESS)
  return data ? JSON.parse(data) : null
}

export function clearFreeformProgress(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEYS.FREEFORM_PROGRESS)
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

export function getExerciseEquipment(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXERCISE_EQUIPMENT)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveExerciseEquipment(equipment: Record<string, string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.EXERCISE_EQUIPMENT, JSON.stringify(equipment))
  } catch (error) {
    console.warn("Error saving exercise equipment:", error)
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
