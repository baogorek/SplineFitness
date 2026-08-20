import {
  ActiveWorkoutSession,
  WorkoutSession,
  WorkoutHistoryEntry,
  IntervalSessionProgress,
  SitSessionProgress,
  CircuitSessionProgress,
  FreeformSessionProgress,
  Vo2MaxSessionProgress,
  LissCoreSessionProgress,
  LissCoreTemplate,
  LissCoreCableSetup,
  ExercisePreference,
  ExerciseSetting,
} from "@/types/workout"
import { FrontierCard } from "@/types/frontier"
import {
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
  VO2MAX_PROGRESS: "strength-tracker:vo2max-progress",
  LISS_CORE_PROGRESS: "strength-tracker:liss-core-progress",
  LISS_CORE_TEMPLATE: "strength-tracker:liss-core-template",
  LISS_CORE_CABLE_SETUP: "strength-tracker:liss-core-cable-setup",
  LISS_CORE_VOICE_CUES: "strength-tracker:liss-core-voice-cues",
  EXERCISE_PREFERENCES: "strength-tracker:exercise-preferences",
  EXERCISE_CHOICES: "strength-tracker:exercise-choices",
  EXERCISE_EQUIPMENT: "strength-tracker:exercise-equipment",
  FRONTIER_CARDS: "strength-tracker:frontier-cards",
  FRONTIER_PENDING: "strength-tracker:frontier-pending",
  PENDING_WORKOUTS: "strength-tracker:pending-workouts",
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

interface PendingWorkoutEntry {
  id: string
  ownerUid: string | null
  revision: string
  session: ActiveWorkoutSession
}

function normalizeCompletedSession(session: ActiveWorkoutSession): ActiveWorkoutSession {
  return JSON.parse(JSON.stringify({
    ...session,
    completedAt: session.completedAt || new Date().toISOString(),
  })) as ActiveWorkoutSession
}

function getPendingWorkoutIdentity(session: ActiveWorkoutSession): string {
  return `${session.mode}:${session.startedAt}`
}

function getWorkoutDocumentId(session: ActiveWorkoutSession): string {
  const safeStartedAt = session.startedAt.replace(/[^a-zA-Z0-9_-]/g, "-")
  return `${session.mode}-${safeStartedAt}`
}

function createLocalId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `workout-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getPendingWorkoutEntries(): PendingWorkoutEntry[] {
  if (typeof window === "undefined") return []

  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_WORKOUTS)
    if (!data) return []
    const parsed: unknown = JSON.parse(data)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is PendingWorkoutEntry => {
      if (!entry || typeof entry !== "object") return false
      const candidate = entry as Partial<PendingWorkoutEntry>
      return typeof candidate.id === "string"
        && (candidate.ownerUid === null || typeof candidate.ownerUid === "string")
        && typeof candidate.revision === "string"
        && Boolean(candidate.session)
        && typeof candidate.session?.mode === "string"
        && typeof candidate.session?.startedAt === "string"
    })
  } catch (error) {
    console.warn("Error reading pending workouts:", error)
    return []
  }
}

function writePendingWorkoutEntries(entries: PendingWorkoutEntry[]): boolean {
  if (typeof window === "undefined") return false

  try {
    if (entries.length === 0) {
      localStorage.removeItem(STORAGE_KEYS.PENDING_WORKOUTS)
    } else {
      localStorage.setItem(STORAGE_KEYS.PENDING_WORKOUTS, JSON.stringify(entries))
    }
    return true
  } catch (error) {
    console.warn("Error saving pending workouts:", error)
    return false
  }
}

function queuePendingWorkoutSession(session: ActiveWorkoutSession): {
  entry: PendingWorkoutEntry
  persisted: boolean
} {
  const storedSession = normalizeCompletedSession(session)
  const entries = getPendingWorkoutEntries()
  const ownerUid = firebaseAuth?.currentUser?.uid ?? null
  const identity = getPendingWorkoutIdentity(storedSession)
  const existingIndex = entries.findIndex((entry) => (
    getPendingWorkoutIdentity(entry.session) === identity
      && (entry.ownerUid === ownerUid || (ownerUid !== null && entry.ownerUid === null))
  ))
  const existing = existingIndex >= 0 ? entries[existingIndex] : null
  const sessionChanged = !existing
    || JSON.stringify(existing.session) !== JSON.stringify(storedSession)
    || existing.ownerUid !== ownerUid
  const entry: PendingWorkoutEntry = existing && !sessionChanged
    ? existing
    : {
        id: existing?.id ?? getWorkoutDocumentId(storedSession),
        ownerUid,
        revision: createLocalId(),
        session: storedSession,
      }

  if (existingIndex >= 0) {
    entries[existingIndex] = entry
  } else {
    entries.push(entry)
  }

  return { entry, persisted: writePendingWorkoutEntries(entries) }
}

function clearPendingWorkoutEntry(id: string, revision: string): void {
  const entries = getPendingWorkoutEntries()
  const current = entries.find((entry) => entry.id === id && entry.revision === revision)
  if (!current) return
  writePendingWorkoutEntries(entries.filter((entry) => (
    entry.id !== id || entry.revision !== revision
  )))
}

async function savePendingWorkoutEntry(entry: PendingWorkoutEntry): Promise<WorkoutHistoryEntry | null> {
  const user = firebaseAuth?.currentUser
  if (!firestore || !user) return null
  if (entry.ownerUid !== null && entry.ownerUid !== user.uid) return null

  try {
    const workoutRef = doc(firestore, "users", user.uid, "workouts", entry.id)
    await setDoc(workoutRef, {
      ...entry.session,
      createdAt: serverTimestamp(),
    })

    clearPendingWorkoutEntry(entry.id, entry.revision)
    clearMatchingWorkoutProgress(entry.session)

    return {
      id: entry.id,
      session: entry.session,
      completedAt: entry.session.completedAt || entry.session.startedAt,
    }
  } catch (error) {
    console.error("Error saving workout session:", error)
    return null
  }
}

export function stageCompletedWorkout(session: ActiveWorkoutSession): ActiveWorkoutSession {
  const { entry, persisted } = queuePendingWorkoutSession(session)
  if (persisted) {
    clearMatchingWorkoutProgress(entry.session)
  }
  return entry.session
}

export async function syncPendingWorkoutSessions(): Promise<void> {
  const user = firebaseAuth?.currentUser
  if (!firestore || !user) return

  const pending = getPendingWorkoutEntries().filter(
    (entry) => entry.ownerUid === null || entry.ownerUid === user.uid
  )
  for (const originalEntry of pending) {
    const { entry } = queuePendingWorkoutSession(originalEntry.session)
    await savePendingWorkoutEntry(entry)
  }
}

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
    throw error
  }
}

export async function saveWorkoutSession(session: ActiveWorkoutSession): Promise<WorkoutHistoryEntry | null> {
  const { entry } = queuePendingWorkoutSession(session)
  return savePendingWorkoutEntry(entry)
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
      clearVo2MaxProgress()
      break
    case "liss-core":
      clearLissCoreProgress()
      break
  }
}

function clearMatchingWorkoutProgress(session: ActiveWorkoutSession): void {
  const currentSession = getCurrentSession()
  if (currentSession?.mode === session.mode && currentSession.startedAt === session.startedAt) {
    clearCurrentSession()
  }

  const progress = (() => {
    switch (session.mode) {
      case "interval": return getIntervalProgress()
      case "sit": return getSitProgress()
      case "circuit": return getCircuitProgress()
      case "freeform": return getFreeformProgress()
      case "vo2max": return getVo2MaxProgress()
      case "liss-core": return getLissCoreProgress()
    }
  })()
  if (progress?.startedAt === session.startedAt) {
    clearWorkoutProgress(session.mode)
  }
}

export async function clearProgressAlreadySavedToHistory(): Promise<void> {
  const savedProgress = [
    { mode: "circuit" as const, progress: getCircuitProgress() },
    { mode: "freeform" as const, progress: getFreeformProgress() },
    { mode: "interval" as const, progress: getIntervalProgress() },
    { mode: "sit" as const, progress: getSitProgress() },
    { mode: "vo2max" as const, progress: getVo2MaxProgress() },
    { mode: "liss-core" as const, progress: getLissCoreProgress() },
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
  try {
    localStorage.setItem(STORAGE_KEYS.CIRCUIT_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn("Error saving circuit progress:", error)
  }
}

export function getCircuitProgress(): CircuitSessionProgress | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CIRCUIT_PROGRESS)
    if (!data) return null
    const parsed: unknown = JSON.parse(data)
    if (
      !isRecord(parsed)
      || (parsed.variant !== "A" && parsed.variant !== "B")
      || !isRecord(parsed.exerciseSettings)
      || typeof parsed.currentRound !== "number"
      || typeof parsed.currentComboIndex !== "number"
      || !Array.isArray(parsed.rounds)
      || !Array.isArray(parsed.currentRoundResults)
      || !Array.isArray(parsed.weakLinks)
      || typeof parsed.roundTimerSeconds !== "number"
      || typeof parsed.startedAt !== "string"
      || typeof parsed.savedAt !== "string"
    ) {
      return null
    }
    if (!isRecord(parsed.exerciseChoices)) {
      parsed.exerciseChoices = {}
    }
    return parsed as unknown as CircuitSessionProgress
  } catch {
    return null
  }
}

export function clearCircuitProgress(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.CIRCUIT_PROGRESS)
  } catch (error) {
    console.warn("Error clearing circuit progress:", error)
  }
}

export function saveFreeformProgress(progress: FreeformSessionProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.FREEFORM_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn("Error saving freeform progress:", error)
  }
}

export function getFreeformProgress(): FreeformSessionProgress | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FREEFORM_PROGRESS)
    if (!data) return null
    const parsed: unknown = JSON.parse(data)
    if (
      !isRecord(parsed)
      || !Array.isArray(parsed.exercises)
      || typeof parsed.elapsedSeconds !== "number"
      || typeof parsed.startedAt !== "string"
      || typeof parsed.savedAt !== "string"
    ) {
      return null
    }
    return parsed as unknown as FreeformSessionProgress
  } catch {
    return null
  }
}

export function clearFreeformProgress(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.FREEFORM_PROGRESS)
  } catch (error) {
    console.warn("Error clearing freeform progress:", error)
  }
}

export function saveVo2MaxProgress(progress: Vo2MaxSessionProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.VO2MAX_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn("Error saving VO2 Max progress:", error)
  }
}

export function getVo2MaxProgress(): Vo2MaxSessionProgress | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VO2MAX_PROGRESS)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearVo2MaxProgress(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.VO2MAX_PROGRESS)
  } catch (error) {
    console.warn("Error clearing VO2 Max progress:", error)
  }
}

export function saveLissCoreProgress(progress: LissCoreSessionProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.LISS_CORE_PROGRESS, JSON.stringify(progress))
  } catch (error) {
    console.warn("Error saving LISS + Core progress:", error)
  }
}

export function getLissCoreProgress(): LissCoreSessionProgress | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LISS_CORE_PROGRESS)
    if (!data) return null
    const parsed = JSON.parse(data) as LissCoreSessionProgress
    if (parsed.template?.version !== 2 || !Array.isArray(parsed.template.blocks)) {
      localStorage.removeItem(STORAGE_KEYS.LISS_CORE_PROGRESS)
      return null
    }
    parsed.cardioSelections ??= {}
    parsed.cableSetup = normalizeLissCoreCableSetup(parsed.cableSetup)
    parsed.previousCableSetup = normalizeLissCoreCableSetup(parsed.previousCableSetup)
    return parsed
  } catch {
    return null
  }
}

export function clearLissCoreProgress(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.LISS_CORE_PROGRESS)
  } catch (error) {
    console.warn("Error clearing LISS + Core progress:", error)
  }
}

export function getLissCoreTemplate(): LissCoreTemplate | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LISS_CORE_TEMPLATE)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function saveLissCoreTemplate(template: LissCoreTemplate): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.LISS_CORE_TEMPLATE, JSON.stringify(template))
  } catch (error) {
    console.warn("Error saving LISS + Core template:", error)
  }
}

const EMPTY_LISS_CORE_CABLE_SETUP: LissCoreCableSetup = {
  useSideSpecificRotation: false,
  rotation: {},
  crunch: {},
  backExtension: {},
}

function normalizeLissCoreCableSetup(value?: Partial<LissCoreCableSetup>): LissCoreCableSetup {
  return {
    useSideSpecificRotation: value?.useSideSpecificRotation ?? false,
    rotation: value?.rotation ?? {},
    ...(value?.rotationLeft && { rotationLeft: value.rotationLeft }),
    ...(value?.rotationRight && { rotationRight: value.rotationRight }),
    crunch: value?.crunch ?? {},
    backExtension: value?.backExtension ?? {},
  }
}

export function getLissCoreCableSetup(): LissCoreCableSetup {
  if (typeof window === "undefined") return EMPTY_LISS_CORE_CABLE_SETUP
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LISS_CORE_CABLE_SETUP)
    return data ? normalizeLissCoreCableSetup(JSON.parse(data)) : EMPTY_LISS_CORE_CABLE_SETUP
  } catch {
    return EMPTY_LISS_CORE_CABLE_SETUP
  }
}

export function saveLissCoreCableSetup(cableSetup: LissCoreCableSetup): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.LISS_CORE_CABLE_SETUP, JSON.stringify(cableSetup))
  } catch (error) {
    console.warn("Error saving LISS + Core cable setup:", error)
  }
}

export function getLissCoreVoiceCues(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEYS.LISS_CORE_VOICE_CUES) === "true"
  } catch {
    return false
  }
}

export function saveLissCoreVoiceCues(enabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.LISS_CORE_VOICE_CUES, String(enabled))
  } catch (error) {
    console.warn("Error saving LISS + Core voice preference:", error)
  }
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
      const localPreferences = getLocalExercisePreferences()
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

      if (Object.keys(localPreferences).length > 0) {
        const batch = writeBatch(firestore)
        Object.values(localPreferences).forEach((preference) => {
          batch.set(
            doc(firestore!, "users", user.uid, "exercisePreferences", preference.exerciseId),
            {
              ...preference,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          )
        })
        await batch.commit()
        clearLocalExercisePreferences()
        return { ...prefs, ...localPreferences }
      }

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
  const prefs = getLocalExercisePreferences()
  prefs[exerciseId] = {
    exerciseId,
    durationSeconds: pref.durationSeconds ?? prefs[exerciseId]?.durationSeconds ?? 60,
  }
  saveLocalExercisePreferences(prefs)

  if (firestore && user) {
    try {
      await setDoc(
        doc(firestore, "users", user.uid, "exercisePreferences", exerciseId),
        {
          exerciseId,
          durationSeconds: prefs[exerciseId].durationSeconds,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      const remaining = getLocalExercisePreferences()
      delete remaining[exerciseId]
      saveLocalExercisePreferences(remaining)
    } catch (error) {
      console.error("Error saving exercise preference:", error)
    }
  }
}

export async function saveBulkExercisePreferences(
  settings: Record<string, ExerciseSetting>
): Promise<void> {
  const user = firebaseAuth?.currentUser
  const db = firestore
  const prefs: Record<string, ExercisePreference> = {}
  Object.entries(settings).forEach(([exerciseId, setting]) => {
    prefs[exerciseId] = {
      exerciseId,
      durationSeconds: setting.durationSeconds,
    }
  })
  saveLocalExercisePreferences(prefs)

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
      clearLocalExercisePreferences()
    } catch (error) {
      console.error("Error saving bulk exercise preferences:", error)
    }
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
    if (Object.keys(prefs).length === 0) {
      localStorage.removeItem(STORAGE_KEYS.EXERCISE_PREFERENCES)
    } else {
      localStorage.setItem(STORAGE_KEYS.EXERCISE_PREFERENCES, JSON.stringify(prefs))
    }
  } catch (error) {
    console.warn("Error saving exercise preferences:", error)
  }
}

function clearLocalExercisePreferences(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.EXERCISE_PREFERENCES)
  } catch (error) {
    console.warn("Error clearing exercise preferences:", error)
  }
}

function getLocalFrontierCards(): FrontierCard[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FRONTIER_CARDS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveLocalFrontierCards(cards: FrontierCard[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.FRONTIER_CARDS, JSON.stringify(cards))
  } catch (error) {
    console.warn("Error saving Frontier Cards:", error)
  }
}

interface PendingFrontierWallet {
  ownerUid: string
  revision: string
  cards: FrontierCard[]
}

const frontierSaveQueues = new Map<string, Promise<void>>()

function getPendingFrontierKey(ownerUid: string): string {
  return `${STORAGE_KEYS.FRONTIER_PENDING}:${ownerUid}`
}

function getPendingFrontierWallet(ownerUid: string): PendingFrontierWallet | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(getPendingFrontierKey(ownerUid))
    if (!data) return null
    const parsed: unknown = JSON.parse(data)
    if (
      !isRecord(parsed)
      || parsed.ownerUid !== ownerUid
      || typeof parsed.revision !== "string"
      || !Array.isArray(parsed.cards)
    ) {
      return null
    }
    return parsed as unknown as PendingFrontierWallet
  } catch {
    return null
  }
}

function savePendingFrontierWallet(ownerUid: string, cards: FrontierCard[]): PendingFrontierWallet {
  const pending = { ownerUid, revision: createLocalId(), cards } satisfies PendingFrontierWallet
  if (typeof window === "undefined") return pending
  try {
    localStorage.setItem(
      getPendingFrontierKey(ownerUid),
      JSON.stringify(pending)
    )
  } catch (error) {
    console.warn("Error saving pending Frontier wallet:", error)
  }
  return pending
}

function clearPendingFrontierWallet(ownerUid: string, revision: string): void {
  if (typeof window === "undefined") return
  try {
    const pending = getPendingFrontierWallet(ownerUid)
    if (pending?.revision === revision) {
      localStorage.removeItem(getPendingFrontierKey(ownerUid))
    }
  } catch (error) {
    console.warn("Error clearing pending Frontier wallet:", error)
  }
}

function clearLocalFrontierCards(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEYS.FRONTIER_CARDS)
  } catch (error) {
    console.warn("Error clearing local Frontier Cards:", error)
  }
}

function clearLocalFrontierCardsIfRepresented(cards: FrontierCard[]): void {
  const walletIds = new Set(cards.map((card) => card.id))
  const localCards = getLocalFrontierCards()
  if (localCards.every((card) => walletIds.has(card.id))) {
    clearLocalFrontierCards()
  }
}

async function reconcileFrontierWallet(
  ownerUid: string,
  cards: FrontierCard[],
  existingIds?: string[]
): Promise<void> {
  if (!firestore) throw new Error("Firestore is not configured")
  const cloudIds = existingIds ?? (
    await getDocs(collection(firestore, "users", ownerUid, "frontierCards"))
  ).docs.map((cardDoc) => cardDoc.id)
  const walletIds = new Set(cards.map((card) => card.id))
  const batch = writeBatch(firestore)
  cards.forEach((card) => {
    batch.set(doc(firestore!, "users", ownerUid, "frontierCards", card.id), card)
  })
  cloudIds.forEach((cardId) => {
    if (!walletIds.has(cardId)) {
      batch.delete(doc(firestore!, "users", ownerUid, "frontierCards", cardId))
    }
  })
  await batch.commit()
}

export async function getFrontierCards(): Promise<FrontierCard[]> {
  const user = firebaseAuth?.currentUser

  if (!firestore || !user) {
    return getLocalFrontierCards().sort((a, b) => a.order - b.order)
  }

  const pendingWallet = getPendingFrontierWallet(user.uid)
  if (pendingWallet) {
    const pendingIds = new Set(pendingWallet.cards.map((card) => card.id))
    const localAdditions = getLocalFrontierCards().filter((card) => (
      !pendingIds.has(card.id) && (card.exercises.length > 0 || card.name !== "Anywhere")
    ))
    const reconciledCards = [...pendingWallet.cards, ...localAdditions]
      .map((card, order) => ({ ...card, order }))
    try {
      await reconcileFrontierWallet(user.uid, reconciledCards)
      clearPendingFrontierWallet(user.uid, pendingWallet.revision)
      clearLocalFrontierCards()
    } catch (error) {
      console.error("Error reconciling pending Frontier wallet:", error)
    }
    return reconciledCards.sort((a, b) => a.order - b.order)
  }

  try {
    const snapshot = await getDocs(collection(firestore, "users", user.uid, "frontierCards"))
    const cloudCards = snapshot.docs
      .map((cardDoc) => cardDoc.data() as FrontierCard)
      .sort((a, b) => a.order - b.order)

    const localCards = getLocalFrontierCards()
    if (localCards.length > 0) {
      const cloudIds = new Set(cloudCards.map((card) => card.id))
      const hasSharedCard = localCards.some((card) => cloudIds.has(card.id))
      const meaningfulLocalCards = localCards.filter((card) => (
        card.exercises.length > 0 || card.name !== "Anywhere"
      ))
      const reconciledCards = cloudCards.length === 0 || hasSharedCard
        ? localCards
        : [...cloudCards, ...meaningfulLocalCards].map((card, order) => ({ ...card, order }))

      if (reconciledCards.length > 0) {
        await reconcileFrontierWallet(
          user.uid,
          reconciledCards,
          snapshot.docs.map((cardDoc) => cardDoc.id)
        )
      }
      clearLocalFrontierCards()
      return reconciledCards.sort((a, b) => a.order - b.order)
    }

    return cloudCards
  } catch (error) {
    console.error("Error fetching Frontier Cards:", error)
    throw error
  }
}

export async function saveFrontierCards(wallet: FrontierCard[]): Promise<void> {
  const user = firebaseAuth?.currentUser

  if (!firestore || !user) {
    saveLocalFrontierCards(wallet)
    return
  }

  const pending = savePendingFrontierWallet(user.uid, wallet)
  const previousSave = frontierSaveQueues.get(user.uid) ?? Promise.resolve()
  const currentSave = previousSave
    .catch(() => undefined)
    .then(async () => {
      try {
        await reconcileFrontierWallet(user.uid, wallet)
        clearPendingFrontierWallet(user.uid, pending.revision)
        clearLocalFrontierCardsIfRepresented(wallet)
      } catch (error) {
        console.error("Error saving Frontier Cards:", error)
        throw error
      }
    })
  frontierSaveQueues.set(user.uid, currentSave)
  try {
    await currentSave
  } finally {
    if (frontierSaveQueues.get(user.uid) === currentSave) {
      frontierSaveQueues.delete(user.uid)
    }
  }
}
