"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface IntervalTimerProps {
  formattedTime: string
  isRunning: boolean
  elapsedSeconds: number
  targetSeconds: number
  currentSet: number
  totalSets: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function IntervalTimer({
  formattedTime,
  isRunning,
  elapsedSeconds,
  targetSeconds,
  currentSet,
  totalSets,
  onStart,
  onPause,
  onReset,
}: IntervalTimerProps) {
  const progress = Math.min((elapsedSeconds / targetSeconds) * 100, 100)
  const currentMinute = Math.floor(elapsedSeconds / 60)

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-muted"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-red-500"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.83} 283`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-foreground tabular-nums">
            {formattedTime}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            Set {currentSet} of {totalSets}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: Math.ceil(targetSeconds / 60) }, (_, i) => i + 1).map((minute) => (
          <div
            key={minute}
            className={cn(
              "h-2 w-12 rounded-full transition-colors duration-300",
              currentMinute >= minute ? "bg-red-500" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        {!isRunning ? (
          <Button
            size="lg"
            onClick={onStart}
            className="h-14 px-8 text-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
          >
            <Play className="mr-2 h-5 w-5" />
            {elapsedSeconds > 0 ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            onClick={onPause}
            className="h-14 px-8 text-lg font-semibold"
          >
            <Pause className="mr-2 h-5 w-5" />
            Pause
          </Button>
        )}
        {elapsedSeconds > 0 && !isRunning && (
          <Button size="lg" variant="outline" onClick={onReset} className="h-14 px-6">
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
