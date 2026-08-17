import { FrontierChange, FrontierMetric, FrontierValue } from "@/types/frontier"

export const FRONTIER_METRIC_OPTIONS: Array<{
  value: FrontierMetric
  label: string
  shortLabel: string
  description: string
}> = [
  {
    value: "reps",
    label: "Repetitions",
    shortLabel: "Reps",
    description: "More repetitions is better",
  },
  {
    value: "weight-time",
    label: "Weight, then time",
    shortLabel: "Weight / time",
    description: "Heavier wins; at equal weight, longer wins",
  },
  {
    value: "duration-longer",
    label: "Hold time",
    shortLabel: "Longer time",
    description: "A longer duration is better",
  },
  {
    value: "duration-faster",
    label: "Completion time",
    shortLabel: "Faster time",
    description: "A shorter duration is better",
  },
  {
    value: "weight",
    label: "Weight",
    shortLabel: "Weight",
    description: "More weight is better",
  },
  {
    value: "speed",
    label: "Speed",
    shortLabel: "Speed",
    description: "A faster speed is better",
  },
  {
    value: "freeform",
    label: "Custom mark",
    shortLabel: "Custom",
    description: "Record any text; the newest mark wins",
  },
]

export function getCurrentFrontier(changes: { value?: FrontierValue }[]): FrontierValue | null {
  return changes.at(-1)?.value ?? null
}

export function getCurrentFrontierChange(changes: FrontierChange[]): FrontierChange | null {
  return changes.at(-1) ?? null
}

export function isFrontierImprovement(
  metric: FrontierMetric,
  current: FrontierValue | null,
  next: FrontierValue
): boolean {
  if (!current) return true
  if (metric === "freeform") return true

  if (metric === "duration-faster") {
    return next.primary < current.primary
  }

  if (metric === "weight-time") {
    if (next.primary !== current.primary) {
      return next.primary > current.primary
    }
    return (next.secondary ?? 0) > (current.secondary ?? 0)
  }

  return next.primary > current.primary
}

export function formatFrontierValue(metric: FrontierMetric, value: FrontierValue | null): string {
  if (!value) return "No mark yet"

  switch (metric) {
    case "reps":
      return `${formatNumber(value.primary)} rep${value.primary === 1 ? "" : "s"}`
    case "weight-time":
      return value.secondary === undefined
        ? `${formatNumber(value.primary)} lb`
        : `${formatNumber(value.primary)} lb / ${formatDuration(value.secondary)}`
    case "duration-longer":
    case "duration-faster":
      return formatDuration(value.primary)
    case "weight":
      return `${formatNumber(value.primary)} lb`
    case "speed":
      return `${formatNumber(value.primary)} mph`
    case "freeform":
      return formatNumber(value.primary)
  }
}

export function formatFrontierChange(
  metric: FrontierMetric,
  change: FrontierChange | null
): string {
  if (!change) return "No mark yet"
  if (change.rawValue) return change.rawValue
  return formatFrontierValue(metric, change.value ?? null)
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, "0")}`
    : `${seconds}s`
}

export function parseDuration(value: string): number | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  const colonMatch = normalized.match(/^(\d+):([0-5]?\d)$/)
  if (colonMatch) {
    return Number(colonMatch[1]) * 60 + Number(colonMatch[2])
  }

  const minuteSecondMatch = normalized.match(/^(?:(\d+)m)?\s*(?:(\d+)s)?$/)
  if (minuteSecondMatch && (minuteSecondMatch[1] || minuteSecondMatch[2])) {
    return Number(minuteSecondMatch[1] || 0) * 60 + Number(minuteSecondMatch[2] || 0)
  }

  const seconds = Number(normalized)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

export function formatDurationInput(totalSeconds: number | undefined): string {
  if (totalSeconds === undefined) return ""
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}
