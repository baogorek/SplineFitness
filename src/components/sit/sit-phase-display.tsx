"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { PHASE_LABELS, PHASE_TOASTS, SitPhase } from "@/data/sit-cues"

interface SitPhaseDisplayProps {
  phase: SitPhase
  formattedTime: string
  elapsedSeconds: number
  targetSeconds: number
  isRunning: boolean
  tissuePrepSet?: number
  onPause: () => void
  onResume: () => void
  onSkip?: () => void
}

export function SitPhaseDisplay({
  phase,
  formattedTime,
  elapsedSeconds,
  targetSeconds,
  isRunning,
  tissuePrepSet,
  onPause,
  onResume,
  onSkip,
}: SitPhaseDisplayProps) {
  const progress = targetSeconds > 0 ? Math.min((elapsedSeconds / targetSeconds) * 100, 100) : 0
  const label = PHASE_LABELS[phase] || phase
  const toast = PHASE_TOASTS[phase]

  const setLabel = phase === "tissue-prep-work" || phase === "tissue-prep-rest"
    ? ` (Set ${tissuePrepSet ?? 1}/2)`
    : ""

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
        {label}{setLabel}
      </p>

      <div className="relative">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none" className="stroke-muted" strokeWidth="6"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none" className="stroke-green-500" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.83} 283`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-foreground tabular-nums">
            {formattedTime}
          </span>
        </div>
      </div>

      {toast && (
        <div className="mx-4 max-w-sm rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs text-green-800 leading-relaxed">{toast}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {isRunning ? (
          <Button
            size="lg"
            variant="secondary"
            onClick={onPause}
            className="h-14 px-8 text-lg font-semibold"
          >
            <Pause className="mr-2 h-5 w-5" />
            Pause
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onResume}
            className="h-14 px-8 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white"
          >
            <Play className="mr-2 h-5 w-5" />
            Resume
          </Button>
        )}
      </div>

      {onSkip && (
        <Button
          size="lg"
          variant="outline"
          onClick={onSkip}
          className="h-12 px-8 text-base font-semibold border-green-500 text-green-600 hover:bg-green-50"
        >
          I'm Ready
        </Button>
      )}
    </div>
  )
}
