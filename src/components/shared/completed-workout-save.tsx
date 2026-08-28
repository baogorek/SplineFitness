"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"
import { saveWorkoutSession, stageCompletedWorkout } from "@/lib/storage"
import { ActiveWorkoutSession } from "@/types/workout"

type SaveStatus = "pending" | "signing-in" | "saving" | "saved" | "error"

interface CompletedWorkoutSaveProps {
  session: ActiveWorkoutSession
}

export function CompletedWorkoutSave({ session }: CompletedWorkoutSaveProps) {
  const { user, signInWithGoogle } = useAuth()
  const [status, setStatus] = useState<SaveStatus>("pending")
  const [message, setMessage] = useState("")
  const sessionSignature = useMemo(() => JSON.stringify(session), [session])
  const sessionRef = useRef(session)
  const signatureRef = useRef(sessionSignature)
  const savedSignatureRef = useRef<string | null>(null)
  const savingRef = useRef(false)
  const retryRequestedRef = useRef(false)
  const mountedRef = useRef(true)

  sessionRef.current = session
  signatureRef.current = sessionSignature

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const attemptSave = useCallback(async function runSaveAttempt(): Promise<void> {
    if (savingRef.current) {
      retryRequestedRef.current = true
      return
    }

    const sessionToSave = sessionRef.current
    const signatureToSave = signatureRef.current
    savingRef.current = true
    if (mountedRef.current) {
      setMessage("")
      setStatus("saving")
    }

    const result = await saveWorkoutSession(sessionToSave)
    const sessionChangedDuringSave = signatureRef.current !== signatureToSave

    if (result && !sessionChangedDuringSave) {
      savedSignatureRef.current = signatureToSave
      if (mountedRef.current) setStatus("saved")
    } else if (!result && !sessionChangedDuringSave) {
      if (mountedRef.current) {
        setMessage("Your completed workout is safe on this device and can be retried.")
        setStatus("error")
      }
    } else {
      retryRequestedRef.current = true
    }

    savingRef.current = false
    if (retryRequestedRef.current) {
      retryRequestedRef.current = false
      void runSaveAttempt()
    }
  }, [])

  useEffect(() => {
    stageCompletedWorkout(session)

    if (!FEATURES.AUTH_ENABLED) return
    if (!user) {
      if (savedSignatureRef.current !== sessionSignature) setStatus("pending")
      return
    }
    if (savedSignatureRef.current !== sessionSignature) {
      void attemptSave()
    }
  }, [attemptSave, session, sessionSignature, user])

  const handleSignInAndSave = async () => {
    setMessage("")
    setStatus("signing-in")
    try {
      await signInWithGoogle()
      await attemptSave()
    } catch (error) {
      console.error("Sign in error:", error)
      setMessage("Sign-in was not completed. Your workout remains safe on this device.")
      setStatus("pending")
    }
  }

  if (!FEATURES.AUTH_ENABLED) return null

  if (status === "saved") {
    return (
      <div className="mt-4 rounded-lg border border-green-600/20 bg-green-600/10 p-3">
        <p className="text-sm font-medium text-green-600">Saved to Workout Calendar</p>
      </div>
    )
  }

  if (status === "saving" || status === "signing-in") {
    return (
      <div className="mt-4 rounded-lg border border-slate-300 bg-slate-100 p-3">
        <p className="text-sm font-medium text-slate-600">
          {status === "signing-in" ? "Signing in…" : "Saving workout…"}
        </p>
      </div>
    )
  }

  return (
    <div className={`mt-4 rounded-lg border p-4 ${status === "error" ? "border-red-600/20 bg-red-600/10" : "border-amber-600/20 bg-amber-600/10"}`}>
      <p className={`text-sm font-medium ${status === "error" ? "text-red-700" : "text-amber-700"}`}>
        {message || (user
          ? "This completed workout has not been saved to your Workout Calendar yet."
          : "Sign in to add this completed workout to your Workout Calendar.")}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={user ? attemptSave : handleSignInAndSave}
        className="mt-3"
      >
        {user ? "Retry save" : "Sign in and save"}
      </Button>
    </div>
  )
}
