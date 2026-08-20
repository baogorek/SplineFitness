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
  const savedElapsed = Number.isFinite(elapsedSeconds)
    ? Math.max(0, Math.floor(elapsedSeconds))
    : 0
  const savedAtMs = Date.parse(savedAt)
  const backgroundSeconds = wasRunning
    && Number.isFinite(savedAtMs)
    && Number.isFinite(restoredAtMs)
    ? Math.max(0, Math.floor((restoredAtMs - savedAtMs) / 1000))
    : 0
  const restoredElapsed = savedElapsed + backgroundSeconds

  return targetSeconds === undefined || !Number.isFinite(targetSeconds)
    ? restoredElapsed
    : Math.min(Math.max(0, targetSeconds), restoredElapsed)
}
