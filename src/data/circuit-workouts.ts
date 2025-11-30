import { CircuitWorkoutDefinition, Combo } from "@/types/workout"

const workoutACombos: Combo[] = [
  {
    id: "anterior-lower-squat",
    category: "ANTERIOR LOWER (SQUAT)",
    durationSeconds: 180,
    subExercises: [
      { id: "alt-single-leg-box-squats", name: "Alt. Single Leg Box Squats", order: 1 },
      { id: "one-half-bottomed-out-squats", name: "1 1/2 Bottomed Out Squats", order: 2 },
      { id: "jump-squats", name: "Jump Squats", order: 3 },
    ],
  },
  {
    id: "upper-push-a",
    category: "UPPER PUSH",
    durationSeconds: 180,
    subExercises: [
      { id: "handstand-pushups", name: "Handstand Pushups", order: 1 },
      { id: "rotational-pushups", name: "Rotational Pushups", order: 2 },
      { id: "cobra-pushups", name: "Cobra Pushups", order: 3 },
    ],
  },
  {
    id: "posterior-lower-hinge-a",
    category: "POSTERIOR LOWER (HINGE)",
    durationSeconds: 180,
    subExercises: [
      { id: "alt-single-leg-heel-touch-squats", name: "Alt. Single Leg Heel Touch Squats", order: 1 },
      { id: "alt-sprinter-lunges-a", name: "Alt. Sprinter Lunges", order: 2 },
      { id: "plyo-sprinter-lunges-a", name: "Plyo Sprinter Lunges", order: 3 },
    ],
  },
  {
    id: "upper-pull-a",
    category: "UPPER PULL",
    durationSeconds: 180,
    subExercises: [
      { id: "pullups", name: "Pullups", order: 1 },
      { id: "human-pullovers", name: "Human Pullovers", order: 2 },
      { id: "inverted-chin-curls", name: "Inverted Chin Curls", order: 3 },
    ],
  },
  {
    id: "abs-a",
    category: "ABS",
    durationSeconds: 180,
    subExercises: [
      { id: "reverse-corkscrews", name: "Reverse Corkscrews", order: 1 },
      { id: "black-widow-knee-slides", name: "Black Widow Knee Slides", order: 2 },
      { id: "levitation-crunches", name: "Levitation Crunches", order: 3 },
    ],
  },
  {
    id: "corrective-a",
    category: "CORRECTIVE",
    durationSeconds: 60,
    subExercises: [
      { id: "angels-and-devils", name: "Angels and Devils", order: 1 },
    ],
  },
]

const workoutBCombos: Combo[] = [
  {
    id: "posterior-lower-hinge-b",
    category: "POSTERIOR LOWER (HINGE)",
    durationSeconds: 180,
    subExercises: [
      { id: "slick-floor-bridge-curls", name: "Slick Floor Bridge Curls", order: 1 },
      { id: "long-leg-marches", name: "Long Leg Marches", order: 2 },
      { id: "high-hip-bucks", name: "High Hip Bucks", order: 3 },
    ],
  },
  {
    id: "upper-push-b",
    category: "UPPER PUSH",
    durationSeconds: 180,
    subExercises: [
      { id: "variable-wall-pushups", name: "Variable Wall Pushups", order: 1 },
      { id: "alt-bw-side-lateral-raises", name: "Alt. BW Side Lateral Raises", order: 2 },
      { id: "bw-triceps-extensions", name: "BW Triceps Extensions", order: 3 },
    ],
  },
  {
    id: "anterior-lower-lunge",
    category: "ANTERIOR LOWER (LUNGE)",
    durationSeconds: 180,
    subExercises: [
      { id: "alt-crossover-step-ups", name: "Alt. Crossover Step Ups", order: 1 },
      { id: "alt-reverse-lunges", name: "Alt. Reverse Lunges", order: 2 },
      { id: "split-squat-jumps", name: "Split Squat Jumps", order: 3 },
    ],
  },
  {
    id: "upper-pull-b",
    category: "UPPER PULL",
    durationSeconds: 180,
    subExercises: [
      { id: "chinups", name: "Chinups", order: 1 },
      { id: "inverted-rows", name: "Inverted Rows", order: 2 },
      { id: "back-widows", name: "Back Widows", order: 3 },
    ],
  },
  {
    id: "abs-b",
    category: "ABS",
    durationSeconds: 180,
    subExercises: [
      { id: "ab-halos", name: "Ab Halos", order: 1 },
      { id: "v-up-tucks", name: "V-Up Tucks", order: 2 },
      { id: "sit-up-elbow-thrusts", name: "Sit-Up Elbow Thrusts", order: 3 },
    ],
  },
  {
    id: "corrective-b",
    category: "CORRECTIVE",
    durationSeconds: 60,
    subExercises: [
      { id: "reverse-hypers", name: "Reverse Hypers", order: 1 },
    ],
  },
]

export const circuitWorkoutA: CircuitWorkoutDefinition = {
  id: "athlean-x-home-a",
  variant: "A",
  name: "Perfect Home Workout A",
  combos: workoutACombos,
}

export const circuitWorkoutB: CircuitWorkoutDefinition = {
  id: "athlean-x-home-b",
  variant: "B",
  name: "Perfect Home Workout B",
  combos: workoutBCombos,
}

export const circuitWorkouts: Record<"A" | "B", CircuitWorkoutDefinition> = {
  A: circuitWorkoutA,
  B: circuitWorkoutB,
}
