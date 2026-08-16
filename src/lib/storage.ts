import {
  ActiveWorkoutSession,
  WorkoutSession,
  WorkoutHistoryEntry,
  IntervalSessionProgress,
  SitSessionProgress,
  CircuitSessionProgress,
  FreeformSessionProgress,
  ExercisePreference,
  ExerciseSetting,
} from "@/types/workout"
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { firebaseAuth, firestore } from "./firebase"

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
  const user = firebaseAuth?.currentUser
  if (!firestore || !user) return []

  try {
    const snapshot = await getDocs(query(
      collection(firestore, "users", user.uid, "workouts"),
      orderBy("completedAt", "desc")
    ))

    return snapshot.docs.map((workoutDoc) => {
      const session = workoutDoc.data() as WorkoutSession
      const completedAt = session.completedAt || session.startedAt
      return {
        id: workoutDoc.id,
        session,
        completedAt,
      }
    })
  } catch (error) {
    console.error("Error fetching workout history:", error)
    return []
  }
}

export async function saveWorkoutSession(session: ActiveWorkoutSession): Promise<WorkoutHistoryEntry | null> {
  const user = firebaseAuth?.currentUser
  if (!firestore || !user) return null

  const completedAt = session.completedAt || new Date().toISOString()
  const storedSession = JSON.parse(JSON.stringify({
    ...session,
    completedAt,
  })) as ActiveWorkoutSession

  try {
    const workoutDoc = await addDoc(
      collection(firestore, "users", user.uid, "workouts"),
      {
        ...storedSession,
        createdAt: serverTimestamp(),
      }
    )

    clearCurrentSession()
    clearWorkoutProgress(session.mode)

    return {
      id: workoutDoc.id,
      session: storedSession,
      completedAt,
    }
  } catch (error) {
    console.error("Error saving workout session:", error)
    return null
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

export function clearWorkoutProgress(mode: ActiveWorkoutSession["mode"]): void {
  switch (mode) {
    case "interval":
      clearIntervalProgress()
      break
    case "sit":
      clearSitProgress()
      break
    case "circuit":
      clearCircuitProgress()
      break
    case "freeform":
      clearFreeformProgress()
      break
    case "vo2max":
      break
  }
}

export async function clearProgressAlreadySavedToHistory(): Promise<void> {
  const savedProgress = [
    { mode: "circuit" as const, progress: getCircuitProgress() },
    { mode: "freeform" as const, progress: getFreeformProgress() },
    { mode: "interval" as const, progress: getIntervalProgress() },
    { mode: "sit" as const, progress: getSitProgress() },
  ].filter((entry) => entry.progress !== null)

  if (savedProgress.length === 0) return

  const user = firebaseAuth?.currentUser
  if (!firestore || !user) return

  const startedAtValues = savedProgress.map((entry) => entry.progress!.startedAt)
  try {
    const snapshot = await getDocs(query(
      collection(firestore, "users", user.uid, "workouts"),
      where("startedAt", "in", startedAtValues)
    ))

    for (const entry of savedProgress) {
      const alreadyCompleted = snapshot.docs.some((workoutDoc) => {
        const data = workoutDoc.data()
        return data.mode === entry.mode && data.startedAt === entry.progress!.startedAt
      })

      if (alreadyCompleted) {
        clearWorkoutProgress(entry.mode)
      }
    }
  } catch (error) {
    console.warn("Error reconciling saved workout progress:", error)
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
  const user = firebaseAuth?.currentUser

  if (firestore && user) {
    try {
      const snapshot = await getDocs(
        collection(firestore, "users", user.uid, "exercisePreferences")
      )
      const prefs: Record<string, ExercisePreference> = {}
      snapshot.docs.forEach((preferenceDoc) => {
        const data = preferenceDoc.data()
        prefs[preferenceDoc.id] = {
          exerciseId: preferenceDoc.id,
          durationSeconds: data.durationSeconds,
        }
      })
      return prefs
    } catch (error) {
      console.error("Error fetching exercise preferences:", error)
      return getLocalExercisePreferences()
    }
  }

  return getLocalExercisePreferences()
}

export async function saveExercisePreference(
  exerciseId: string,
  pref: Partial<ExercisePreference>
): Promise<void> {
  const user = firebaseAuth?.currentUser

  if (firestore && user) {
    try {
      await setDoc(
        doc(firestore, "users", user.uid, "exercisePreferences", exerciseId),
        {
          exerciseId,
          durationSeconds: pref.durationSeconds ?? 60,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
    } catch (error) {
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
  const user = firebaseAuth?.currentUser
  const db = firestore

  if (db && user) {
    try {
      const batch = writeBatch(db)
      Object.entries(settings).forEach(([exerciseId, setting]) => {
        batch.set(
          doc(db, "users", user.uid, "exercisePreferences", exerciseId),
          {
            exerciseId,
            durationSeconds: setting.durationSeconds,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      })
      await batch.commit()
    } catch (error) {
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
