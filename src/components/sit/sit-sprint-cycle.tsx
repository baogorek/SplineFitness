"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { SprintRecord } from "@/types/workout"
import { AtpStatusBar } from "./atp-status-bar"

interface SprintReadyProps {
  sprintNumber: number
  onGo: () => void
  onEndWorkout: () => void
}

export function SprintReady({ sprintNumber, onGo, onEndWorkout }: SprintReadyProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
        Sprint {sprintNumber}
      </p>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Press Ready to start a 4-second countdown. Hold phone in one hand. Place other hand on the ground in sprinter's stance.
      </p>
      <Button
        size="lg"
        onClick={onGo}
        className="h-16 px-12 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white"
      >
        Ready
      </Button>
      <Button variant="secondary" size="default" onClick={onEndWorkout}>
        End Workout
      </Button>
    </div>
  )
}

interface SprintActiveProps {
  onStop: () => void
}

export function SprintActive({ onStop }: SprintActiveProps) {
  const [displayTime, setDisplayTime] = useState("0.0")
  const startTimeRef = useRef(performance.now())
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startTimeRef.current = performance.now()
    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000
      setDisplayTime(elapsed.toFixed(1))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleStop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const finalTime = (performance.now() - startTimeRef.current) / 1000
    onStop()
    void finalTime // time is captured by parent via performance.now delta
  }, [onStop])

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 flex items-center justify-center">
        <span className="text-7xl font-mono font-bold text-foreground tabular-nums">
          {displayTime}s
        </span>
      </div>
      <button
        onClick={handleStop}
        className="min-h-[40vh] w-full bg-red-600 active:bg-red-700 text-white text-4xl font-bold flex items-center justify-center"
      >
        STOP
      </button>
    </div>
  )
}

interface SprintRecoveryProps {
  formattedTime: string
  recoveryElapsed: number
  recoveryTargetSeconds?: number
  sprintHistory: SprintRecord[]
  bestTime: number | null
  onSkipRecovery?: () => void
  onDiscardLast?: () => void
}

export function SprintRecovery({
  formattedTime,
  recoveryElapsed,
  recoveryTargetSeconds,
  sprintHistory,
  bestTime,
  onSkipRecovery,
  onDiscardLast,
}: SprintRecoveryProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
        Recovery
      </p>
      <span className="text-5xl font-mono font-bold text-foreground tabular-nums">
        {formattedTime}
      </span>

      <div className="w-full max-w-sm">
        <AtpStatusBar elapsedSeconds={recoveryElapsed} targetSeconds={recoveryTargetSeconds} />
      </div>

      {onSkipRecovery && (
        <Button
          size="lg"
          onClick={onSkipRecovery}
          className="h-14 px-10 text-lg font-bold bg-green-500 hover:bg-green-600 text-white"
        >
          I'm Ready
        </Button>
      )}

      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sprint History
        </p>
        {sprintHistory.map((s) => (
          <div
            key={s.sprintNumber}
            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
          >
            <span className="text-sm text-muted-foreground">Sprint {s.sprintNumber}</span>
            <span className={`text-sm font-mono font-bold ${
              bestTime !== null && s.timeSeconds === bestTime
                ? "text-green-600"
                : "text-foreground"
            }`}>
              {s.timeSeconds.toFixed(1)}s
            </span>
          </div>
        ))}
      </div>

      {onDiscardLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscardLast}
          className="text-destructive border-destructive/50 hover:bg-destructive/10"
        >
          Discard Last Sprint
        </Button>
      )}
    </div>
  )
}
