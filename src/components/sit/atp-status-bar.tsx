"use client"

import { ATP_STAGES, ATP_FULL_LABEL, ATP_FULL_COLOR, SPRINT_RECOVERY_SECONDS } from "@/data/sit-cues"

interface AtpStatusBarProps {
  elapsedSeconds: number
}

export function AtpStatusBar({ elapsedSeconds }: AtpStatusBarProps) {
  const progress = Math.min((elapsedSeconds / SPRINT_RECOVERY_SECONDS) * 100, 100)

  let currentColor = ATP_FULL_COLOR
  let currentLabel = ATP_FULL_LABEL
  for (const stage of ATP_STAGES) {
    if (elapsedSeconds < stage.maxSeconds) {
      currentColor = stage.color
      currentLabel = stage.label
      break
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ATP Status
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${currentColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{currentLabel}</p>
    </div>
  )
}
