"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { hasAutomaticFrontierEffortToday, hasFrontierEffortToday } from "@/lib/frontier-attempts"
import { getFrontierExerciseStructure } from "@/lib/frontier-structure"
import { FrontierExercise } from "@/types/frontier"

export function FrontierAttemptButton({ exercise, onSetToday }: {
  exercise: FrontierExercise
  onSetToday: (tried: boolean) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryState, setRetryState] = useState<boolean | null>(null)
  const tried = hasFrontierEffortToday(exercise)
  const automatic = hasAutomaticFrontierEffortToday(exercise)
  const name = getFrontierExerciseStructure(exercise).name
  const save = async () => {
    const next = retryState ?? !tried
    setRetryState(next)
    setBusy(true)
    setError(null)
    try {
      await onSetToday(next)
      setRetryState(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save. Please retry.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="shrink-0">
      <button type="button" aria-pressed={tried} disabled={busy || (automatic && !error)}
        aria-label={error ? `Retry saving attempt for ${name}` : automatic ? `${name} tried today` : tried ? `Remove today's attempt for ${name}` : `Mark ${name} as tried today`}
        onClick={() => void save()}
        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-default ${tried ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100"}`}>
        {tried && !error && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
        {busy ? "Saving…" : error ? "Retry save" : "Tried today"}
      </button>
      {error && <p role="alert" className="mt-1 max-w-32 text-xs text-red-600">{error}</p>}
    </div>
  )
}
