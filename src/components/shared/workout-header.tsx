"use client"

import { ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkoutVariant, WorkoutMode } from "@/types/workout"

interface WorkoutHeaderProps {
  mode: WorkoutMode
  activeWorkout: WorkoutVariant
  setActiveWorkout: (workout: WorkoutVariant) => void
  timerDisplay?: string
  progressText?: string
  progressPercent?: number
  onModeChange?: () => void
}

export function WorkoutHeader({
  mode,
  activeWorkout,
  setActiveWorkout,
  timerDisplay = "00:00",
  progressText,
  progressPercent = 0,
  onModeChange,
}: WorkoutHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onModeChange} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {mode === "circuit" ? "CIRCUIT" : "TRADITIONAL"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">{timerDisplay}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveWorkout("A")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeWorkout === "A"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Workout A
            </button>
            <button
              onClick={() => setActiveWorkout("B")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeWorkout === "B"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Workout B
            </button>
          </div>

          {progressText && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Progress</p>
                <p className="text-sm font-mono font-semibold text-foreground">{progressText}</p>
              </div>
              <div className="h-10 w-10 relative">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    className="stroke-primary transition-all duration-500"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercent * 0.88} 88`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
