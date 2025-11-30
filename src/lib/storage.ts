import { WorkoutSession, WorkoutHistoryEntry, CircuitWorkoutSession } from "@/types/workout"
import { supabase } from "./supabase"

const STORAGE_KEYS = {
  CURRENT_SESSION: "strength-tracker:current-session",
} as const

export async function getWorkoutHistory(): Promise<WorkoutHistoryEntry[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
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
  const isCircuit = session.mode === 'circuit'
  const circuitSession = session as CircuitWorkoutSession

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: null,
      mode: session.mode,
      workout_id: session.workoutId,
      variant: session.variant,
      started_at: session.startedAt,
      completed_at: session.completedAt || new Date().toISOString(),
      data: isCircuit ? { rounds: circuitSession.rounds } : { exercises: (session as any).exercises },
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

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
