export function scheduleCountdownTicks(
  playTick: () => void,
  durationSeconds: number,
  speedMultiplier: number,
  maxTicks = 5
): NodeJS.Timeout[] {
  const tick = 1000 / speedMultiplier
  const timeouts: NodeJS.Timeout[] = []
  for (let remaining = Math.min(maxTicks, durationSeconds); remaining >= 1; remaining--) {
    const delay = (durationSeconds - remaining) * tick
    timeouts.push(setTimeout(() => playTick(), delay))
  }
  return timeouts
}
