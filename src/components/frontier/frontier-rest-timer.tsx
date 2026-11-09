"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function FrontierRestTimer({ startedAt, onDismiss }: { startedAt: number; onDismiss: () => void }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const interval = window.setInterval(tick, 250)
    document.addEventListener("visibilitychange", tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [])

  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <div className="mx-auto mb-3 flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700">
      <span>Resting</span>
      <span role="timer" aria-label="Rest time" className="font-mono tabular-nums">{time}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss rest timer" className="flex h-11 w-11 items-center justify-center rounded-full">
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
