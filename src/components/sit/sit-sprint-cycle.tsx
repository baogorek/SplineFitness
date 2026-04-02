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
    void finalTime
  }, [onStop])

  return (
    <button
      onClick={handleStop}
      className="flex flex-col flex-1 w-full bg-red-600 active:bg-red-700 items-center justify-center min-h-screen"
    >
      <span className="text-7xl font-mono font-bold text-white tabular-nums">
        {displayTime}s
      </span>
      <span className="text-lg text-red-200 mt-4 uppercase tracking-wider font-semibold">
        Tap anywhere to stop
      </span>
    </button>
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
  onEditSprint?: (sprintNumber: number, newTime: number) => void
  onEndWorkout?: () => void
}

export function SprintRecovery({
  formattedTime,
  recoveryElapsed,
  recoveryTargetSeconds,
  sprintHistory,
  bestTime,
  onSkipRecovery,
  onDiscardLast,
  onEditSprint,
  onEndWorkout,
}: SprintRecoveryProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [editingSprintNum, setEditingSprintNum] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  const lastSprint = sprintHistory.length > 0 ? sprintHistory[sprintHistory.length - 1] : null

  const handleSnapToAvg = () => {
    if (sprintHistory.length < 2 || editingSprintNum === null) return
    const others = sprintHistory.filter((s) => s.sprintNumber !== editingSprintNum)
    const avg = others.reduce((sum, s) => sum + s.timeSeconds, 0) / others.length
    setEditValue(avg.toFixed(1))
  }

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
          <div key={s.sprintNumber}>
            {editingSprintNum === s.sprintNumber ? (
              <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sprint {s.sprintNumber}</span>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20 text-sm font-mono font-bold text-center rounded border border-border bg-background px-2 py-1"
                    autoFocus
                  />
                  <span className="text-sm text-muted-foreground">s</span>
                </div>
                <div className="flex items-center gap-2">
                  {sprintHistory.length >= 2 && (
                    <Button variant="outline" size="sm" onClick={handleSnapToAvg} className="text-xs">
                      Snap to avg
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSprintNum(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const val = parseFloat(editValue)
                      if (!isNaN(val) && val > 0 && onEditSprint) {
                        onEditSprint(s.sprintNumber, val)
                      }
                      setEditingSprintNum(null)
                    }}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 cursor-pointer active:bg-muted/80"
                onClick={() => {
                  if (onEditSprint) {
                    setEditingSprintNum(s.sprintNumber)
                    setEditValue(s.timeSeconds.toFixed(1))
                  }
                }}
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
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {onDiscardLast && !showDiscardConfirm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiscardConfirm(true)}
            className="text-destructive border-destructive/50 hover:bg-destructive/10"
          >
            Discard Last Sprint
          </Button>
        )}

        {onEndWorkout && !showEndConfirm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
          >
            End Workout
          </Button>
        )}
      </div>

      {showDiscardConfirm && onDiscardLast && lastSprint && (
        <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm text-amber-800 text-center">
            Discard sprint {lastSprint.sprintNumber} ({lastSprint.timeSeconds.toFixed(1)}s)?
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowDiscardConfirm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowDiscardConfirm(false)
                onDiscardLast()
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {showEndConfirm && onEndWorkout && (
        <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <p className="text-sm text-amber-800 text-center">
            End workout now? Your {sprintHistory.length} sprint{sprintHistory.length !== 1 ? "s" : ""} will be saved.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowEndConfirm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={onEndWorkout} className="bg-amber-600 hover:bg-amber-700 text-white">
              End Workout
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
