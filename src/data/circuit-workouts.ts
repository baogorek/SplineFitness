import { CircuitWorkoutDefinition, Combo } from "@/types/workout"

const VIDEO_BASE = "https://youtu.be/vc1E5CfRfos?si=lGVndkH9DqHSJnri"

const workoutACombos: Combo[] = [
  {
    id: "anterior-lower-squat",
    category: "ANTERIOR LOWER (SQUAT)",
    durationSeconds: 180,
    subExercises: [
      {
        id: "alt-single-leg-box-squats",
        name: "Alt. Single Leg Box Squats",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=240`, label: "Demo" }],
      },
      {
        id: "one-half-bottomed-out-squats",
        name: "1 1/2 Bottomed Out Squats",
        order: 2,
        videos: [{ url: `${VIDEO_BASE}&t=260`, label: "Demo" }],
      },
      {
        id: "jump-squats",
        name: "Jump Squats",
        order: 3,
        videos: [{ url: `${VIDEO_BASE}&t=280`, label: "Demo" }],
      },
    ],
  },
  {
    id: "upper-push-a",
    category: "UPPER PUSH",
    durationSeconds: 180,
    subExercises: [
      {
        id: "handstand-pushups",
        name: "Handstand Pushups",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=315`, label: "Demo" }],
        alternative: {
          id: "power-pushaways",
          name: "Power Pushaways",
          videos: [{ url: `${VIDEO_BASE}&t=323`, label: "Demo" }],
        },
        defaultChoice: "alternative",
      },
      {
        id: "rotational-pushups",
        name: "Rotational Pushups",
        order: 2,
        prepTimeSeconds: 5,
        videos: [{ url: `${VIDEO_BASE}&t=334`, label: "Demo" }],
      },
      {
        id: "cobra-pushups",
        name: "Cobra Pushups",
        order: 3,
        videos: [{ url: `${VIDEO_BASE}&t=359`, label: "Demo" }],
      },
    ],
  },
  {
    id: "posterior-lower-hinge-a",
    category: "POSTERIOR LOWER (HINGE)",
    durationSeconds: 180,
    subExercises: [
      {
        id: "alt-single-leg-heel-touch-squats",
        name: "Alternating Heel Touch Squats",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=382`, label: "Advanced" }],
        alternative: {
          id: "kickstand-heel-touch-squats",
          name: "Kickstand Heel Touch Squats",
          videos: [{ url: `${VIDEO_BASE}&t=399`, label: "Kickstand" }],
        },
        defaultChoice: "alternative",
      },
      {
        id: "alt-sprinter-lunges-a",
        name: "Alt. Sprinter Lunges",
        order: 2,
        videos: [{ url: `${VIDEO_BASE}&t=410`, label: "Demo" }],
      },
      {
        id: "plyo-sprinter-lunges-a",
        name: "Plyo Sprinter Lunges",
        order: 3,
        videos: [{ url: `${VIDEO_BASE}&t=426`, label: "Demo" }],
      },
    ],
  },
  {
    id: "upper-pull-a",
    category: "UPPER PULL",
    durationSeconds: 180,
    subExercises: [
      {
        id: "pullups",
        name: "Pullups",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=448`, label: "Demo" }],
        alternative: {
          id: "seated-pullups",
          name: "Seated Pullups",
          videos: [{ url: `${VIDEO_BASE}&t=460`, label: "Demo" }],
        },
        defaultChoice: "alternative",
      },
      {
        id: "inverted-chin-curls",
        name: "Inverted Chin Curls",
        order: 2,
        videos: [{ url: `${VIDEO_BASE}&t=527`, label: "Demo" }],
      },
      {
        id: "human-pullovers",
        name: "Human Pullovers",
        order: 3,
        prepTimeSeconds: 7,
        videos: [{ url: `${VIDEO_BASE}&t=476`, label: "Demo" }],
        alternative: {
          id: "sliding-pulldowns",
          name: "Sliding Pulldowns",
          videos: [{ url: `${VIDEO_BASE}&t=512`, label: "Demo" }],
        },
        defaultChoice: "alternative",
      },
    ],
  },
  {
    id: "abs-a",
    category: "ABS",
    durationSeconds: 180,
    subExercises: [
      {
        id: "reverse-corkscrews",
        name: "Reverse Corkscrews",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=544`, label: "Demo" }],
      },
      {
        id: "black-widow-knee-slides",
        name: "Black Widow Knee Slides",
        order: 2,
        prepTimeSeconds: 5,
        videos: [{ url: `${VIDEO_BASE}&t=558`, label: "Demo" }],
      },
      {
        id: "levitation-crunches",
        name: "Levitation Crunches",
        order: 3,
        prepTimeSeconds: 5,
        videos: [{ url: `${VIDEO_BASE}&t=574`, label: "Demo" }],
      },
    ],
  },
  {
    id: "corrective-a",
    category: "CORRECTIVE",
    durationSeconds: 60,
    subExercises: [
      {
        id: "angels-and-devils",
        name: "Angels and Devils",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=574`, label: "Demo" }],
      },
    ],
  },
]

const workoutBCombos: Combo[] = [
  {
    id: "posterior-lower-hinge-b",
    category: "POSTERIOR LOWER (HINGE)",
    durationSeconds: 180,
    subExercises: [
      {
        id: "slick-floor-bridge-curls",
        name: "Slick Floor Bridge Curls",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=644`, label: "Demo" }],
      },
      {
        id: "long-leg-marches",
        name: "Long Leg Marches",
        order: 2,
        videos: [{ url: `${VIDEO_BASE}&t=674`, label: "Demo" }],
      },
      {
        id: "high-hip-bucks",
        name: "High Hip Bucks",
        order: 3,
        prepTimeSeconds: 5,
        videos: [{ url: `${VIDEO_BASE}&t=696`, label: "Demo" }],
      },
    ],
  },
  {
    id: "upper-push-b",
    category: "UPPER PUSH",
    durationSeconds: 180,
    subExercises: [
      {
        id: "variable-wall-pushups",
        name: "Variable Wall Pushups",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=716`, label: "Demo" }],
        alternative: {
          id: "decline-knee-to-flat-pushups",
          name: "Decline Knee to Flat Pushups",
          videos: [{ url: `${VIDEO_BASE}&t=744`, label: "Demo" }],
        },
        defaultChoice: "alternative",
      },
      {
        id: "alt-bw-side-lateral-raises",
        name: "BW Side Lateral Raises",
        order: 2,
        prepTimeSeconds: 5,
        videos: [{ url: `${VIDEO_BASE}`, label: "Full" }],
        alternative: {
          id: "bw-side-lateral-raises-knees",
          name: "BW Side Lateral Raises (Knees)",
          videos: [{ url: `${VIDEO_BASE}&t=777`, label: "From Knees" }],
        },
        defaultChoice: "alternative",
      },
      {
        id: "bw-triceps-extensions",
        name: "BW Triceps Extensions",
        order: 3,
        prepTimeSeconds: 7,
        videos: [{ url: `${VIDEO_BASE}&t=788`, label: "Demo" }],
      },
    ],
  },
  {
    id: "anterior-lower-lunge",
    category: "ANTERIOR LOWER (LUNGE)",
    durationSeconds: 180,
    subExercises: [
      {
        id: "alt-crossover-step-ups",
        name: "Alt. Crossover Step Ups",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=808`, label: "Demo" }],
      },
      {
        id: "alt-reverse-lunges",
        name: "Alt. Reverse Lunges",
        order: 2,
        prepTimeSeconds: 3,
        videos: [{ url: `${VIDEO_BASE}&t=827`, label: "Demo" }],
      },
      {
        id: "split-squat-jumps",
        name: "Split Squat Jumps",
        order: 3,
        videos: [{ url: `${VIDEO_BASE}&t=841`, label: "Demo" }],
      },
    ],
  },
  {
    id: "upper-pull-b",
    category: "UPPER PULL",
    durationSeconds: 180,
    subExercises: [
      {
        id: "chinups",
        name: "Chinups",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=856`, label: "Demo" }],
        alternative: {
          id: "seated-chinups",
          name: "Seated Chinups",
          videos: [{ url: `${VIDEO_BASE}&t=866`, label: "Demo" }],
        },
        defaultChoice: "alternative",
      },
      {
        id: "inverted-rows",
        name: "Inverted Rows",
        order: 2,
        videos: [{ url: `${VIDEO_BASE}&t=873`, label: "Demo" }],
      },
      {
        id: "back-widows",
        name: "Back Widows",
        order: 3,
        prepTimeSeconds: 7,
        videos: [{ url: `${VIDEO_BASE}&t=891`, label: "Demo" }],
      },
    ],
  },
  {
    id: "abs-b",
    category: "ABS",
    durationSeconds: 180,
    subExercises: [
      {
        id: "ab-halos",
        name: "Ab Halos",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=907`, label: "Demo" }],
      },
      {
        id: "v-up-tucks",
        name: "V-Up Tucks",
        order: 2,
        videos: [{ url: `${VIDEO_BASE}&t=923`, label: "Demo" }],
      },
      {
        id: "sit-up-elbow-thrusts",
        name: "Sit-Up Elbow Thrusts",
        order: 3,
        videos: [{ url: `${VIDEO_BASE}&t=931`, label: "Demo" }],
      },
    ],
  },
  {
    id: "corrective-b",
    category: "CORRECTIVE",
    durationSeconds: 60,
    subExercises: [
      {
        id: "reverse-hypers",
        name: "Reverse Hypers",
        order: 1,
        videos: [{ url: `${VIDEO_BASE}&t=942`, label: "Demo" }],
      },
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
