import { TraditionalExercise, TraditionalWorkoutDefinition } from "@/types/workout"

export const rpeOptions = [
  { value: "6", label: "RPE 6 — Easy" },
  { value: "7", label: "RPE 7 — Moderate" },
  { value: "8", label: "RPE 8 — Hard" },
  { value: "9", label: "RPE 9 — Very Hard" },
  { value: "10", label: "RPE 10 — Failure" },
]

function createSets(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    weight: "",
    reps: "",
    rpe: "",
  }))
}

const workoutAExercises: TraditionalExercise[] = [
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    muscleGroup: "Quadriceps • Glutes",
    prescribedSets: 3,
    prescribedReps: 12,
    restPeriod: "90s",
    sets: createSets(3),
  },
  {
    id: "push-up",
    name: "Push Up",
    muscleGroup: "Chest • Triceps • Anterior Deltoid",
    prescribedSets: 3,
    prescribedReps: 15,
    restPeriod: "60s",
    sets: createSets(3),
  },
  {
    id: "inverted-row",
    name: "Inverted Row",
    muscleGroup: "Lats • Rhomboids • Biceps",
    prescribedSets: 3,
    prescribedReps: 10,
    restPeriod: "90s",
    sets: createSets(3),
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroup: "Hamstrings • Glutes • Erectors",
    prescribedSets: 3,
    prescribedReps: 10,
    restPeriod: "120s",
    sets: createSets(3),
  },
]

const workoutBExercises: TraditionalExercise[] = [
  {
    id: "db-bench-press",
    name: "Dumbbell Bench Press",
    muscleGroup: "Chest • Triceps",
    prescribedSets: 4,
    prescribedReps: 10,
    restPeriod: "120s",
    sets: createSets(4),
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroup: "Lats • Biceps • Rear Deltoid",
    prescribedSets: 4,
    prescribedReps: 12,
    restPeriod: "90s",
    sets: createSets(4),
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroup: "Quadriceps • Glutes",
    prescribedSets: 3,
    prescribedReps: 15,
    restPeriod: "120s",
    sets: createSets(3),
  },
  {
    id: "shoulder-press",
    name: "Seated Shoulder Press",
    muscleGroup: "Deltoids • Triceps",
    prescribedSets: 3,
    prescribedReps: 10,
    restPeriod: "90s",
    sets: createSets(3),
  },
]

export const traditionalWorkoutA: TraditionalWorkoutDefinition = {
  id: "traditional-a",
  variant: "A",
  name: "Traditional Workout A",
  exercises: workoutAExercises,
}

export const traditionalWorkoutB: TraditionalWorkoutDefinition = {
  id: "traditional-b",
  variant: "B",
  name: "Traditional Workout B",
  exercises: workoutBExercises,
}

export const traditionalWorkouts: Record<"A" | "B", TraditionalWorkoutDefinition> = {
  A: traditionalWorkoutA,
  B: traditionalWorkoutB,
}

export function createFreshExercises(workout: TraditionalWorkoutDefinition): TraditionalExercise[] {
  return workout.exercises.map((ex) => ({
    ...ex,
    sets: createSets(ex.prescribedSets),
  }))
}
