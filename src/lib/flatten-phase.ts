import { CoachedExercise, CoachedPhase } from "@/types/workout"

export type CoachedStep =
  | {
      type: "exercise"
      exercise: CoachedExercise
      setNumber?: number
      totalSets?: number
      side?: "Left" | "Right"
      supersetContext?: {
        label: string
        exerciseLabel: string
        round: number
        totalRounds: number
      }
    }
  | {
      type: "rest"
      durationSeconds: number
      supersetLabel: string
      afterRound: number
      totalRounds: number
    }

type SupersetContext = {
  label: string
  exerciseLabel: string
  round: number
  totalRounds: number
}

function expandExercise(
  exercise: CoachedExercise,
  supersetContext?: SupersetContext
): CoachedStep[] {
  const steps: CoachedStep[] = []
  const sets = exercise.sets || 1
  const isTimed = !!exercise.durationSeconds

  if (isTimed && exercise.perSide) {
    for (let s = 1; s <= sets; s++) {
      for (const side of ["Left", "Right"] as const) {
        steps.push({
          type: "exercise",
          exercise,
          setNumber: sets > 1 ? s : undefined,
          totalSets: sets > 1 ? sets : undefined,
          side,
          supersetContext: supersetContext ?? undefined,
        })
      }
    }
  } else if (sets > 1 && isTimed) {
    for (let s = 1; s <= sets; s++) {
      steps.push({
        type: "exercise",
        exercise,
        setNumber: s,
        totalSets: sets,
        supersetContext: supersetContext ?? undefined,
      })
    }
  } else {
    steps.push({
      type: "exercise",
      exercise,
      supersetContext: supersetContext ?? undefined,
    })
  }

  return steps
}

export function flattenPhase(phase: CoachedPhase): CoachedStep[] {
  const steps: CoachedStep[] = []

  for (const item of phase.items) {
    if (item.type === "exercise") {
      steps.push(...expandExercise(item.exercise))
    } else {
      const { superset } = item
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

      for (let round = 1; round <= superset.rounds; round++) {
        for (let ei = 0; ei < superset.exercises.length; ei++) {
          const ex = superset.exercises[ei]
          const exerciseLabel = superset.exercises.length > 1
            ? `${letters[ei] || (ei + 1).toString()}`
            : ""
          const ctx = {
            label: superset.label,
            exerciseLabel,
            round,
            totalRounds: superset.rounds,
          }
          steps.push(...expandExercise(ex, ctx))
        }

        if (round < superset.rounds && superset.restBetweenRoundsSeconds) {
          steps.push({
            type: "rest",
            durationSeconds: superset.restBetweenRoundsSeconds,
            supersetLabel: superset.label,
            afterRound: round,
            totalRounds: superset.rounds,
          })
        }
      }
    }
  }

  return steps
}
