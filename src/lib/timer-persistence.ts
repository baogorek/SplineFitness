interface RestoreElapsedOptions {
  elapsedSeconds: number
  savedAt: string
  wasRunning: boolean
  restoredAtMs: number
  targetSeconds?: number
}

/**
 * Rebuilds a persisted timer at the moment the saved session was reopened.
 * Time spent on a resume prompt is intentionally excluded.
 */
export function restoreElapsedSeconds({
  elapsedSeconds,
  savedAt,
  wasRunning,
  restoredAtMs,
  targetSeconds,
}: RestoreElapsedOptions): number {
  const savedElapsed = Math.max(0, Math.floor(elapsedSeconds))
  const savedAtMs = Date.parse(savedAt)
  const backgroundSeconds = wasRunning && Number.isFinite(savedAtMs)
    ? Math.max(0, Math.floor((restoredAtMs - savedAtMs) / 1000))
    : 0
  const restoredElapsed = savedElapsed + backgroundSeconds

  return targetSeconds === undefined
    ? restoredElapsed
    : Math.min(targetSeconds, restoredElapsed)
}
