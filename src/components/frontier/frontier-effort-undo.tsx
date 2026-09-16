"use client"

import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getLatestFrontierTimerEffort, hasFrontierMarkForEffort } from "@/lib/frontier-effort"
import { formatDuration } from "@/lib/frontier-utils"
import { FrontierExercise } from "@/types/frontier"

export function FrontierEffortUndo({ exercise, onUndo }: {
  exercise: FrontierExercise
  onUndo: (attemptId: string) => Promise<void>
}) {
  const [pending, setPending] = useState<ReturnType<typeof getLatestFrontierTimerEffort>>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const effort = pending ?? getLatestFrontierTimerEffort(exercise)
  const linkedMark = effort && hasFrontierMarkForEffort(exercise, effort.id)
  const undo = async () => {
    if (!effort) return
    setPending(effort)
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await onUndo(effort.id)
      setPending(null)
      setNotice("Timed effort removed.")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the removal. Please retry.")
    } finally {
      setBusy(false)
    }
  }
  if (!effort && !notice) return null
  return (
    <div className="mt-2 border-t border-indigo-100 pt-2">
      {effort && <>
        <p className="text-xs text-slate-500">Last timed effort: {formatDuration(effort.elapsedSeconds ?? 0)} · {new Date(effort.attemptedAt).toLocaleDateString()}</p>
        <Button variant="ghost" size="sm" className="mt-1 min-h-11 px-0 text-slate-600" disabled={busy} onClick={() => void undo()}>
          <RotateCcw aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />{busy ? "Removing…" : error ? "Retry undo" : "Undo last timed effort"}
        </Button>
        {linkedMark && <p className="text-xs text-slate-500">Also removes the frontier mark saved from this effort.</p>}
      </>}
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      {notice && <p role="status" className="mt-1 text-xs text-emerald-700">{notice}</p>}
    </div>
  )
}
