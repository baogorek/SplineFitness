export function scheduleCountdownTicks(
  playTick: () => void,
  durationSeconds: number,
  speedMultiplier: number,
): NodeJS.Timeout[] {
  const safeDuration = Number.isFinite(durationSeconds)
    ? Math.max(0, Math.floor(durationSeconds))
    : 0
  const safeSpeed = Number.isFinite(speedMultiplier) && speedMultiplier > 0
    ? speedMultiplier
    : 1
  const tick = 1000 / safeSpeed
  const timeouts: NodeJS.Timeout[] = []
  for (let remaining = safeDuration; remaining >= 1; remaining--) {
    const delay = (safeDuration - remaining) * tick
    timeouts.push(setTimeout(() => playTick(), delay))
  }
  return timeouts
}
