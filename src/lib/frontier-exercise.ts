import { FrontierChange, FrontierEntrySave, FrontierExercise } from "@/types/frontier"

/** Changing units starts a new frontier without reinterpreting or deleting old marks. */
export function updateFrontierExercise(
  exercise: FrontierExercise,
  entry: FrontierEntrySave,
  now: string
): FrontierExercise {
  const metricChanged = entry.metric !== exercise.metric
  const changes = metricChanged ? [] : exercise.changes
  const hasNewMark = Boolean(entry.value || entry.rawValue)
    && (metricChanged || entry.valueAction === "progress" || entry.valueAction === "correction")
  const nextChanges: FrontierChange[] = hasNewMark
    ? [...changes, {
        id: crypto.randomUUID(),
        ...(entry.value ? { value: entry.value } : {}),
        ...(entry.rawValue ? { rawValue: entry.rawValue } : {}),
        recordedAt: now,
        kind: !metricChanged && entry.valueAction === "correction" ? "correction" : "progress",
      }]
    : changes
  const archiveHistory = metricChanged
    && (exercise.changes.length > 0 || (exercise.attempts?.length ?? 0) > 0)

  return {
    ...exercise,
    name: entry.name,
    equipment: entry.equipment,
    bodyPart: entry.bodyPart,
    metric: entry.metric,
    metricSource: "user",
    changes: nextChanges,
    ...(metricChanged ? { attempts: [] } : {}),
    ...(archiveHistory ? {
      metricHistory: [...(exercise.metricHistory ?? []), {
        id: crypto.randomUUID(),
        metric: exercise.metric,
        changes: exercise.changes,
        attempts: exercise.attempts ?? [],
        endedAt: now,
      }],
    } : {}),
    updatedAt: now,
  }
}
