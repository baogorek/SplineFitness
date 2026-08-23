import { parseDuration } from "@/lib/frontier-utils"
import {
  FrontierChange,
  FrontierExercise,
  FrontierMetric,
  FrontierValue,
} from "@/types/frontier"

export type ParsedFrontierMetric = "weight-time" | "weight" | "reps" | "speed"

export interface ParsedFrontierMark {
  metric: ParsedFrontierMetric
  value: FrontierValue
}

/**
 * Parses only marks whose meaning is explicit in the text. A caller may pass
 * an expected metric when the surrounding exercise or row already supplies
 * the missing context (for example, `120 / 1:45` in a weight/time history).
 */
export function parseFrontierMark(
  rawValue: string,
  expectedMetric?: FrontierMetric
): ParsedFrontierMark | null {
  const normalized = rawValue.trim()
  if (!normalized) return null

  const weightTime = normalized.match(
    /^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?|#)\s*\/\s*(.+)$/i
  )
  if (weightTime) {
    const seconds = parseDuration(weightTime[2])
    if (seconds !== null && seconds > 0) {
      return {
        metric: "weight-time",
        value: { primary: Number(weightTime[1]), secondary: seconds },
      }
    }
  }

  if (expectedMetric === "weight-time") {
    const contextualWeightTime = normalized.match(/^(\d+(?:\.\d+)?)\s*\/\s*(.+)$/)
    if (contextualWeightTime) {
      const seconds = parseDuration(contextualWeightTime[2])
      if (seconds !== null && seconds > 0) {
        return {
          metric: "weight-time",
          value: { primary: Number(contextualWeightTime[1]), secondary: seconds },
        }
      }
    }
  }

  const weight = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?|#)$/i)
  if (weight) {
    return { metric: "weight", value: { primary: Number(weight[1]) } }
  }

  const reps = normalized.match(/^(\d+)\s*(?:reps?|x)$/i)
  if (reps) {
    return { metric: "reps", value: { primary: Number(reps[1]) } }
  }

  const speed = normalized.match(/^(\d+(?:\.\d+)?)\s*mph$/i)
  if (speed) {
    return { metric: "speed", value: { primary: Number(speed[1]) } }
  }

  return null
}

/**
 * Infers a metric for an entire history. Unitless weight/time shorthand is
 * accepted only when at least one mark explicitly establishes weight/time
 * context and every other mark is compatible with it.
 */
export function parseFrontierMarkHistory(rawValues: string[]): {
  metric: ParsedFrontierMetric
  marks: ParsedFrontierMark[]
} | null {
  if (rawValues.length === 0) return null

  let marks = rawValues.map((rawValue) => parseFrontierMark(rawValue))
  const hasExplicitWeightTime = marks.some((mark) => mark?.metric === "weight-time")
  const onlyWeightCompatibleMarks = marks.every(
    (mark) => mark === null || mark.metric === "weight" || mark.metric === "weight-time"
  )

  if (hasExplicitWeightTime && onlyWeightCompatibleMarks) {
    marks = rawValues.map((rawValue, index) => (
      marks[index] ?? parseFrontierMark(rawValue, "weight-time")
    ))
  }

  if (marks.some((mark) => mark === null)) return null
  const parsedMarks = marks as ParsedFrontierMark[]
  const metrics = new Set(parsedMarks.map((mark) => mark.metric))

  if ([...metrics].every((metric) => metric === "weight" || metric === "weight-time")) {
    return {
      metric: metrics.has("weight-time") ? "weight-time" : "weight",
      marks: parsedMarks,
    }
  }

  if (metrics.size !== 1) return null
  return { metric: parsedMarks[0].metric, marks: parsedMarks }
}

export function frontierChangesMatch(a: FrontierChange, b: FrontierChange): boolean {
  if (a.value && b.value) {
    return a.value.primary === b.value.primary
      && (a.value.secondary ?? null) === (b.value.secondary ?? null)
  }

  if (!a.value && !b.value && a.rawValue && b.rawValue) {
    return a.rawValue.trim() === b.rawValue.trim()
  }

  return false
}

/** Removes adjacent duplicate marks while retaining the newer event. */
export function dedupeFrontierChanges(changes: FrontierChange[]): FrontierChange[] {
  return changes.reduce<FrontierChange[]>((deduped, change) => {
    const previous = deduped.at(-1)
    if (previous && frontierChangesMatch(previous, change)) {
      deduped[deduped.length - 1] = change
    } else {
      deduped.push(change)
    }
    return deduped
  }, [])
}

/** Appends new events without replacing an equivalent current event. */
export function appendUniqueFrontierChanges(
  existing: FrontierChange[],
  incoming: FrontierChange[]
): FrontierChange[] {
  return incoming.reduce<FrontierChange[]>((changes, change) => {
    const current = changes.at(-1)
    if (!current || !frontierChangesMatch(current, change)) changes.push(change)
    return changes
  }, [...existing])
}

/**
 * Upgrades conservatively parseable legacy free-text histories and repairs
 * parseable raw marks in already typed exercises.
 */
export function normalizeFrontierExerciseMarks(
  exercise: FrontierExercise
): FrontierExercise {
  let metric = exercise.metric
  let changes = exercise.changes

  if (metric === "freeform") {
    const rawValues = changes.map((change) => change.rawValue)
    if (rawValues.every((rawValue): rawValue is string => Boolean(rawValue))) {
      const parsed = parseFrontierMarkHistory(rawValues)
      if (parsed) {
        metric = parsed.metric
        changes = changes.map((change, index) => ({
          ...change,
          value: parsed.marks[index].value,
        }))
      }
    }
  } else {
    changes = changes.map((change) => {
      if (change.value || !change.rawValue) return change
      const parsed = parseFrontierMark(change.rawValue, metric)
      if (!parsed || !metricsAreCompatible(metric, parsed.metric)) return change
      return { ...change, value: parsed.value }
    })
  }

  const dedupedChanges = dedupeFrontierChanges(changes)
  if (metric === exercise.metric && dedupedChanges === exercise.changes) return exercise
  if (
    metric === exercise.metric
    && dedupedChanges.length === exercise.changes.length
    && dedupedChanges.every((change, index) => change === exercise.changes[index])
  ) {
    return exercise
  }

  return { ...exercise, metric, changes: dedupedChanges }
}

function metricsAreCompatible(metric: FrontierMetric, parsedMetric: ParsedFrontierMetric): boolean {
  if (metric === parsedMetric) return true
  return metric === "weight-time" && parsedMetric === "weight"
}
