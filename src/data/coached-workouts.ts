import { CoachedWorkoutDefinition } from "@/types/workout"

export const COACHED_WORKOUTS: CoachedWorkoutDefinition[] = [
  {
    id: "joyces-workout",
    name: "Joyce's Workout (Regression/Recovery)",
    shortName: "Joyce's Workout",
    description: "Lighter version with safer exercise substitutions to protect the core. Designed for hernia recovery / diastasis recti repair.",
    phases: [
      {
        id: "joyce-p1",
        name: "Warm Up & Stabilize",
        phaseNumber: 1,
        items: [
          {
            type: "exercise",
            exercise: {
              id: "joyce-step-jacks",
              name: "Step-Jacks (No Jumping)",
              durationSeconds: 120,
              why: "Get the tissues warm without the high impact of jumping.",
              cue: "Step one foot out to the side while raising arms, return to center, switch sides. Keep a rhythm.",
              videos: [{ url: "https://www.youtube.com/watch?v=iSSAk4XCsRA" }],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "joyce-hip-circles",
              name: "Hip Circles",
              sets: 2,
              reps: "8-10 each direction",
              perSide: true,
              why: "Lubricate the hips before squats.",
              cue: "Keep hands off the floor if possible; keep spine tall.",
            },
          },
          {
            type: "superset",
            superset: {
              id: "joyce-mcgill",
              label: "Spine — McGill Big 3 (Modified)",
              rounds: 1,
              instruction: "Non-negotiable. Stabilize the core.",
              exercises: [
                {
                  id: "joyce-bird-dog",
                  name: "Bird Dog",
                  sets: 4,
                  durationSeconds: 10,
                  perSide: true,
                  cue: "\"Tray of drinks on your lower back.\" Anti-Rotation.",
                },
                {
                  id: "joyce-side-plank",
                  name: "Side Plank",
                  sets: 3,
                  durationSeconds: 10,
                  perSide: true,
                  cue: "\"String pulling hips to the sky.\" Lateral Stability.",
                },
                {
                  id: "joyce-dead-bug",
                  name: "Dead Bug (Regression)",
                  sets: 8,
                  durationSeconds: 3,
                  note: "Substitution for Curl-Up. Keep head on the floor.",
                  cue: "Press lower back into the ground. Extend opposite arm/leg slowly.",
                },
              ],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "joyce-glute-bridge",
              name: "Glute Bridge (Isometric)",
              reps: "3 reps",
              holdSeconds: 10,
              why: "Wake up the Engine (Glutes).",
              videos: [{ url: "https://www.youtube.com/watch?v=vtnpY_fYJ4M" }],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "joyce-kb-halo",
              name: "Kettlebell Halo",
              reps: "10 reps / direction",
              perSide: true,
              note: "Keep weight very light.",
              cue: "Watch for rib flare. If ribs pop up, the core is disengaged.",
              videos: [{ url: "https://www.youtube.com/watch?v=wJcmanVh5EE" }],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "joyce-kb-rack-hold",
              name: "KB Rack Hold",
              sets: 2,
              durationSeconds: 10,
              perSide: true,
              why: "Activate Grip & Rotator Cuff. Keep weight moderate.",
              videos: [{ url: "https://www.youtube.com/shorts/H3Zg_mH14vc" }],
            },
          },
        ],
      },
      {
        id: "joyce-p2",
        name: "Resistance Training",
        phaseNumber: 2,
        items: [
          {
            type: "superset",
            superset: {
              id: "joyce-block-a",
              label: "Block A: Anterior Chain (Squat & Push)",
              rounds: 3,
              restBetweenRoundsSeconds: 90,
              instruction: "Perform A1 & A2 back-to-back. Rest 90 seconds. Repeat 3 times.",
              exercises: [
                {
                  id: "joyce-goblet-squat",
                  name: "Dumbbell Goblet Squat (Light)",
                  sets: 3,
                  reps: "8-10",
                  note: "Go lighter than you think you need. Focus purely on depth and mechanics, not load.",
                  why: "Holding the weight in front forces the core to brace (Anti-Flexion). Self-correcting.",
                  cue: "\"Elbows inside knees at the bottom. Chest tall like a soldier.\"",
                },
                {
                  id: "joyce-seated-press",
                  name: "Seated High-Incline DB Press",
                  sets: 3,
                  reps: "8-10",
                  note: "Substitution for Standing Single-Arm Press. Set a bench to a high incline (not fully vertical).",
                  why: "Provides back support to protect the core while still working the shoulders.",
                  cue: "\"Neutral Grip (Palms facing ears). Keep ribs down.\"",
                },
              ],
            },
          },
          {
            type: "superset",
            superset: {
              id: "joyce-block-b",
              label: "Block B: Posterior Chain (Hinge & Pull)",
              rounds: 3,
              restBetweenRoundsSeconds: 90,
              instruction: "Perform B1 & B2 back-to-back. Rest 90 seconds. Repeat 3 times.",
              exercises: [
                {
                  id: "joyce-rdl",
                  name: "Dumbbell Romanian Deadlift (RDL)",
                  sets: 3,
                  reps: "10-12",
                  why: "Teaches the \"Hinge\" pattern. Low risk for core if spine stays neutral.",
                  cue: "\"Shave your legs with the dumbbells. Push your hips back until you feel a stretch in the hamstrings. Squeeze glutes to stand.\"",
                },
                {
                  id: "joyce-tripod-row",
                  name: "Tripod Row (Hernia-Safe)",
                  sets: 3,
                  reps: "10-12 per side",
                  perSide: true,
                  why: "The non-working hand provides massive stability, reducing shear force on the core.",
                  cue: "\"Put your non-working hand on a bench/wall. Pull your elbow to your hip pocket. Don't let your shoulder dip toward the floor.\"",
                  videos: [{ url: "https://www.youtube.com/shorts/q65uDGJ9ZPs" }],
                },
              ],
            },
          },
        ],
      },
      {
        id: "joyce-p3",
        name: "Finisher",
        phaseNumber: 3,
        description: "Carries to build dynamic endurance with strict safety parameters.",
        items: [
          {
            type: "exercise",
            exercise: {
              id: "joyce-elevated-pushup",
              name: "Hands-Elevated Pushup",
              sets: 2,
              note: "Substitution for Standard Pushup. Place hands on a sturdy bench, couch arm, or countertop.",
              why: "Reduces the gravity load on the core to prevent coning.",
              cue: "\"Body in a straight line. Core braced.\"",
            },
          },
          {
            type: "superset",
            superset: {
              id: "joyce-carry-pull",
              label: "Carry & Pull Superset",
              rounds: 3,
              instruction: "Perform 1a, 1b, and 1c back-to-back with minimal rest.",
              exercises: [
                {
                  id: "joyce-suitcase-carry-l",
                  name: "Suitcase Carry (Left Hand)",
                  durationSeconds: 30,
                  note: "Watch for coning. If you lean sideways, the weight is too heavy.",
                },
                {
                  id: "joyce-suitcase-carry-r",
                  name: "Suitcase Carry (Right Hand)",
                  durationSeconds: 30,
                },
                {
                  id: "joyce-face-pull",
                  name: "Face Pull (or Band Pull-Apart)",
                  reps: "15",
                  cue: "\"Pull the rope/band to your forehead. Keep elbows high. Squeeze the back of your shoulders.\"",
                },
              ],
            },
          },
        ],
      },
      {
        id: "joyce-p4",
        name: "The Flush (Walking)",
        phaseNumber: 4,
        items: [
          {
            type: "exercise",
            exercise: {
              id: "joyce-walking",
              name: "Walking",
              durationSeconds: 180,
              why: "Walking is the #1 driver of lymphatic drainage. Acts as a manual pump to clear fluid and inflammation before sitting down.",
              cue: "Walk until breathing returns to 100% normal (hum a tune without gasping) and the \"throbbing\" (pump) subsides.",
            },
          },
        ],
      },
      {
        id: "joyce-p5",
        name: "Stretching",
        phaseNumber: 5,
        description: "Restoring length to compressed tissues.",
        items: [
          {
            type: "exercise",
            exercise: {
              id: "joyce-childs-pose",
              name: "Child's Pose",
              durationSeconds: 45,
              note: "Substitution for Dead Hang.",
              why: "Gently lengthens the spine and lat muscles without the intense traction force of hanging.",
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "joyce-couch-stretch",
              name: "Couch Stretch",
              durationSeconds: 60,
              perSide: true,
              why: "The only move that simultaneously stretches the Quad (Knee Flexion) and the Hip (Hip Extension). Addresses the tightness from sitting and squatting.",
              videos: [{ url: "https://www.youtube.com/watch?v=Fg-lwNBzVV8" }],
            },
          },
        ],
      },
    ],
  },
  {
    id: "apt-stability-hypertrophy",
    name: "Apt. Stability & Hypertrophy",
    shortName: "Stability & Hypertrophy",
    description: "Full dumbbell/kettlebell program with hypertrophy focus. Phase-based coached workout for apartment gym training.",
    phases: [
      {
        id: "apt-p1",
        name: "Warm Up & Stabilize",
        phaseNumber: 1,
        items: [
          {
            type: "exercise",
            exercise: {
              id: "apt-jumping-jacks",
              name: "Jumping Jacks",
              durationSeconds: 120,
              why: "Get the tissues warm (Tootsie Roll effect).",
              videos: [{ url: "https://www.youtube.com/watch?v=iSSAk4XCsRA" }],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "apt-90-90-hip",
              name: "90/90 Hip Switch",
              durationSeconds: 60,
              why: "Lubricate the hips before the squats. Keep your hands off the floor if possible; keep spine tall.",
              videos: [{ url: "https://www.youtube.com/watch?v=m51AZSXMvEA" }],
            },
          },
          {
            type: "superset",
            superset: {
              id: "apt-mcgill",
              label: "Spine — McGill Big 3",
              rounds: 1,
              instruction: "Non-negotiable. Stabilize the core.",
              exercises: [
                {
                  id: "apt-bird-dog",
                  name: "Bird Dog",
                  sets: 4,
                  durationSeconds: 10,
                  perSide: true,
                  why: "Anti-Rotation.",
                  cue: "\"You have a tray of drinks on your lower back.\" Engage in abdominal bracing, back stays flat.",
                },
                {
                  id: "apt-side-plank",
                  name: "Side Plank",
                  sets: 3,
                  durationSeconds: 10,
                  perSide: true,
                  why: "Lateral Stability (Replaces Clamshell).",
                  cue: "\"Pretend there's a string pulling your hips up to the sky.\"",
                },
                {
                  id: "apt-curl-up",
                  name: "Curl-Up",
                  sets: 6,
                  durationSeconds: 10,
                  why: "Anterior Stiffness.",
                  note: "Neutral spine with curvature, one leg back, hands sensing pressure in lower back.",
                },
              ],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "apt-glute-bridge",
              name: "Glute Bridge (Isometric)",
              reps: "3 reps",
              holdSeconds: 10,
              why: "Wake up the Engine (Glutes).",
              videos: [{ url: "https://www.youtube.com/watch?v=vtnpY_fYJ4M" }],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "apt-kb-halo",
              name: "Kettlebell Halo",
              reps: "10 reps / direction",
              perSide: true,
              why: "Lubricate the shoulder \"clock.\"",
              videos: [{ url: "https://www.youtube.com/watch?v=wJcmanVh5EE" }],
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "apt-kb-rack-hold",
              name: "KB Rack Hold",
              sets: 2,
              durationSeconds: 10,
              why: "Activate Grip & Rotator Cuff.",
              videos: [{ url: "https://www.youtube.com/watch?v=wLNgt4bzEAs" }],
            },
          },
        ],
      },
      {
        id: "apt-p2",
        name: "Hypertrophy Focused Resistance",
        phaseNumber: 2,
        description: "For newer lifters, do 1-2 light sets to groove the pattern before the heavy sets.",
        items: [
          {
            type: "superset",
            superset: {
              id: "apt-block-a",
              label: "Block A: Anterior Chain (Squat & Push)",
              rounds: 3,
              restBetweenRoundsSeconds: 90,
              instruction: "Perform A1 & A2 back-to-back. Rest 90 seconds. Repeat 3 times.",
              exercises: [
                {
                  id: "apt-goblet-squat",
                  name: "Dumbbell Goblet Squat",
                  sets: 3,
                  reps: "8-10",
                  why: "Holding the weight in front forces the core to brace (Anti-Flexion). If they slouch, they drop it. Self-correcting.",
                  cue: "\"Elbows inside knees at the bottom. Chest tall like a soldier.\"",
                },
                {
                  id: "apt-sa-press",
                  name: "Standing Single-Arm DB Press",
                  sets: 3,
                  reps: "8-10 per arm",
                  perSide: true,
                  why: "Using one arm while standing creates an \"Off-Balance\" load. The core must fire wildly to keep the ribs square.",
                  cue: "\"Don't let your ribs flare up. Keep the 'bowl of soup' level.\"",
                },
              ],
            },
          },
          {
            type: "superset",
            superset: {
              id: "apt-block-b",
              label: "Block B: Posterior Chain (Hinge & Pull)",
              rounds: 3,
              restBetweenRoundsSeconds: 90,
              instruction: "Perform B1 & B2 back-to-back. Rest 90 seconds. Repeat 3 times.",
              exercises: [
                {
                  id: "apt-rdl",
                  name: "Dumbbell Romanian Deadlift (RDL)",
                  sets: 3,
                  reps: "10-12",
                  why: "Teaches the \"Hinge\" pattern (moving at hips, not back). Hold two DBs in front of thighs.",
                  cue: "\"Shave your legs with the dumbbells. Push your hips back until you feel a stretch in the hamstrings. Squeeze glutes to stand.\"",
                },
                {
                  id: "apt-tripod-row",
                  name: "Tripod Row",
                  sets: 3,
                  reps: "10-12 per side",
                  perSide: true,
                  cue: "\"Put your non-working hand on a bench/wall. Pull your elbow to your hip pocket. Don't let your shoulder dip toward the floor.\"",
                  videos: [{ url: "https://www.youtube.com/shorts/q65uDGJ9ZPs" }],
                },
              ],
            },
          },
        ],
      },
      {
        id: "apt-p3",
        name: "Finisher",
        phaseNumber: 3,
        description: "Replaces GHD/Back Extension. Carries build dynamic endurance.",
        items: [
          {
            type: "exercise",
            exercise: {
              id: "apt-pushup",
              name: "The Perfect Pushup",
              sets: 2,
              cue: "Think — a perfect plank that's also a pushup.",
            },
          },
          {
            type: "superset",
            superset: {
              id: "apt-carry-pull",
              label: "Carry & Pull Superset",
              rounds: 3,
              instruction: "Perform 1a, 1b, and 1c back-to-back with minimal rest. Repeat 3 times.",
              exercises: [
                {
                  id: "apt-suitcase-carry-l",
                  name: "Suitcase Carry (Left Hand)",
                  durationSeconds: 30,
                },
                {
                  id: "apt-suitcase-carry-r",
                  name: "Suitcase Carry (Right Hand)",
                  durationSeconds: 30,
                },
                {
                  id: "apt-face-pull",
                  name: "Face Pull (or Band Pull-Apart)",
                  reps: "15",
                  why: "This lets your grip recover from the carries while you work the rear delts.",
                  cue: "\"Pull the rope to your forehead. Keep your elbows high. Squeeze the back of your shoulders.\"",
                },
              ],
            },
          },
        ],
      },
      {
        id: "apt-p4",
        name: "The Flush (Walking)",
        phaseNumber: 4,
        items: [
          {
            type: "exercise",
            exercise: {
              id: "apt-walking",
              name: "Walking",
              durationSeconds: 180,
              why: "< 2 min: muscles still full of fluid/pressure, fighting the stretch. 5+ min: tissue temperature drops, making stretches less effective. 3 min is the Goldilocks zone.",
              cue: "Walk until breathing returns to 100% normal (hum a tune without gasping) and the \"throbbing\" feeling in your legs (the pump) subsides.",
            },
          },
        ],
      },
      {
        id: "apt-p5",
        name: "Stretching",
        phaseNumber: 5,
        items: [
          {
            type: "exercise",
            exercise: {
              id: "apt-dead-hang",
              name: "Dead Hang",
              durationSeconds: 45,
              why: "Decompression. Gravity creates space between vertebrae compressed by Goblet Squats and heavy Carries. This is the \"reset\" button for your spine.",
            },
          },
          {
            type: "exercise",
            exercise: {
              id: "apt-couch-stretch",
              name: "Couch Stretch",
              durationSeconds: 60,
              perSide: true,
              why: "The only move that simultaneously stretches the Quad (Knee Flexion) and the Hip (Hip Extension). Addresses the tightness from sitting and squatting.",
              videos: [{ url: "https://www.youtube.com/watch?v=Fg-lwNBzVV8" }],
            },
          },
        ],
      },
    ],
  },
]
