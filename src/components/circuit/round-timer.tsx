"use client"

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface RoundTimerProps {
  formattedTime: string
  isRunning: boolean
  round: number
  label?: string
  className?: string
}

export function RoundTimer({ formattedTime, isRunning, round, label, className }: RoundTimerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            isRunning ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
          )}
        />
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {label || `Round ${round}`}
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-lg font-mono font-bold text-foreground tabular-nums">
          {formattedTime}
        </span>
      </div>
    </div>
  )
}
