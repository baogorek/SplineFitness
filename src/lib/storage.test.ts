import { beforeEach, describe, expect, it, vi } from "vitest"
import { FreeformWorkoutSession } from "@/types/workout"

const firebaseState = vi.hoisted(() => ({
  auth: { currentUser: null as { uid: string } | null },
  firestore: { name: "test-firestore" },
}))

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((...parts: unknown[]) => parts.slice(1).join("/")),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  batchSet: vi.fn(),
  batchDelete: vi.fn(),
  batchCommit: vi.fn(),
}))

vi.mock("@/lib/firebase", () => ({
  firebaseAuth: firebaseState.auth,
  firestore: firebaseState.firestore,
}))

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: firestoreMocks.doc,
  getDocs: firestoreMocks.getDocs,
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => "server-time"),
  setDoc: firestoreMocks.setDoc,
  where: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: firestoreMocks.batchSet,
    delete: firestoreMocks.batchDelete,
    commit: firestoreMocks.batchCommit,
  })),
}))

import { saveFrontierCards, saveWorkoutSession, stageCompletedWorkout } from "./storage"
import { FrontierCard } from "@/types/frontier"

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const session: FreeformWorkoutSession = {
  mode: "freeform",
  startedAt: "2026-08-19T12:34:56.000Z",
  completedAt: "2026-08-19T13:00:00.000Z",
  exercises: [],
}

describe("completed workout persistence", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    })
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: new MemoryStorage(),
    })
    firebaseState.auth.currentUser = null
    firestoreMocks.doc.mockClear()
    firestoreMocks.getDocs.mockReset()
    firestoreMocks.setDoc.mockReset()
    firestoreMocks.batchSet.mockReset()
    firestoreMocks.batchDelete.mockReset()
    firestoreMocks.batchCommit.mockReset()
  })

  it("queues the completed workout before clearing its active checkpoint", () => {
    localStorage.setItem("strength-tracker:current-session", JSON.stringify(session))
    localStorage.setItem("strength-tracker:freeform-progress", JSON.stringify({
      exercises: [],
      elapsedSeconds: 10,
      startedAt: session.startedAt,
      savedAt: "2026-08-19T12:45:00.000Z",
    }))

    stageCompletedWorkout(session)

    const pending = JSON.parse(localStorage.getItem("strength-tracker:pending-workouts") ?? "[]")
    expect(pending).toHaveLength(1)
    expect(pending[0].session).toEqual(session)
    expect(localStorage.getItem("strength-tracker:current-session")).toBeNull()
    expect(localStorage.getItem("strength-tracker:freeform-progress")).toBeNull()
  })

  it("does not clear a newer workout checkpoint while syncing an older completion", () => {
    const newerProgress = {
      exercises: [],
      elapsedSeconds: 10,
      startedAt: "2026-08-19T14:00:00.000Z",
      savedAt: "2026-08-19T14:01:00.000Z",
    }
    localStorage.setItem(
      "strength-tracker:freeform-progress",
      JSON.stringify(newerProgress)
    )

    stageCompletedWorkout(session)

    expect(JSON.parse(localStorage.getItem("strength-tracker:freeform-progress") ?? "null"))
      .toEqual(newerProgress)
  })

  it("keeps a failed save retryable, then removes it after an idempotent save", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    stageCompletedWorkout(session)
    firebaseState.auth.currentUser = { uid: "user-1" }
    firestoreMocks.setDoc.mockRejectedValueOnce(new Error("offline"))

    expect(await saveWorkoutSession(session)).toBeNull()
    expect(localStorage.getItem("strength-tracker:pending-workouts")).not.toBeNull()

    firestoreMocks.setDoc.mockResolvedValueOnce(undefined)
    const saved = await saveWorkoutSession(session)

    expect(saved?.id).toBe("freeform-2026-08-19T12-34-56-000Z")
    expect(firestoreMocks.setDoc).toHaveBeenLastCalledWith(
      "users/user-1/workouts/freeform-2026-08-19T12-34-56-000Z",
      expect.objectContaining({ mode: "freeform", createdAt: "server-time" })
    )
    expect(localStorage.getItem("strength-tracker:pending-workouts")).toBeNull()
    errorSpy.mockRestore()
  })

  it("reconciles the entire Frontier wallet so cloud deletions are durable", async () => {
    const now = "2026-08-19T12:00:00.000Z"
    const card: FrontierCard = {
      id: "kept-card",
      name: "Gym",
      exercises: [],
      order: 0,
      createdAt: now,
      updatedAt: now,
    }
    firebaseState.auth.currentUser = { uid: "user-1" }
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [{ id: "kept-card" }, { id: "deleted-card" }],
    })
    firestoreMocks.batchCommit.mockResolvedValueOnce(undefined)

    await saveFrontierCards([card])

    expect(firestoreMocks.batchSet).toHaveBeenCalledWith(
      "users/user-1/frontierCards/kept-card",
      card
    )
    expect(firestoreMocks.batchDelete).toHaveBeenCalledWith(
      "users/user-1/frontierCards/deleted-card"
    )
    expect(localStorage.getItem("strength-tracker:frontier-pending:user-1")).toBeNull()
  })
})
