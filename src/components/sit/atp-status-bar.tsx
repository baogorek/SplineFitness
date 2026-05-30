interface RecoveryStatusBarProps {
  elapsedSeconds: number
}

const RECOVERY_WINDOWS = [
  {
    maxSeconds: 120,
    label: "Recharging",
    description: "Let breathing settle and keep the next rep optional.",
    color: "bg-red-500",
  },
  {
    maxSeconds: 180,
    label: "Minimum Window",
    description: "Enough to consider going, not a command to sprint.",
    color: "bg-yellow-500",
  },
  {
    maxSeconds: 300,
    label: "Quality Sprint Window",
    description: "Better for all-out reps. Extend if mechanics feel off.",
    color: "bg-lime-500",
  },
  {
    maxSeconds: Infinity,
    label: "Full Recovery",
    description: "Best window for another true max-effort sprint.",
    color: "bg-green-500",
  },
]

const WINDOW_MARKERS = [
  { seconds: 120, label: "2:00" },
  { seconds: 180, label: "3:00" },
  { seconds: 300, label: "5:00" },
]

export function RecoveryStatusBar({ elapsedSeconds }: RecoveryStatusBarProps) {
  const progress = Math.min((elapsedSeconds / 300) * 100, 100)
  const currentWindow =
    RECOVERY_WINDOWS.find((recoveryWindow) => elapsedSeconds < recoveryWindow.maxSeconds) ??
    RECOVERY_WINDOWS[RECOVERY_WINDOWS.length - 1]

  const markerLabel = elapsedSeconds < 120
    ? "Minimum starts at 2:00"
    : elapsedSeconds < 180
      ? "Quality window starts at 3:00"
      : elapsedSeconds < 300
        ? "Full recovery at 5:00"
        : "Full recovery window"

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recovery Window
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {markerLabel}
        </span>
      </div>
      <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${currentWindow.color}`}
          style={{ width: `${progress}%` }}
        />
        {WINDOW_MARKERS.map((marker) => (
          <div
            key={marker.seconds}
            className="absolute top-0 h-full w-px bg-background/80"
            style={{ left: `${Math.min((marker.seconds / 300) * 100, 100)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>0:00</span>
        {WINDOW_MARKERS.map((marker) => (
          <span key={marker.seconds}>{marker.label}</span>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
        <p className="text-sm font-semibold text-foreground">{currentWindow.label}</p>
        <p className="text-xs text-muted-foreground">{currentWindow.description}</p>
      </div>
    </div>
  )
}
