# Muscle Formula Quiz Data

This folder contains data for the 6-Step Muscle Control Formula quiz. Use this guide to add new joints, muscles, and scenarios.

## Files Overview

| File | Purpose |
|------|---------|
| `muscle-bank.ts` | Master list of all muscles (for Step 6 checkboxes) |
| `joint-muscle-mappings.ts` | Which muscles perform which movements (Table 4.2) |
| `scenarios.ts` | Exercise scenarios to quiz on |
| `formula-steps.ts` | The 6 step definitions (rarely changes) |
| `answer-options.ts` | Dropdown options for each step |

---

## Adding a New Joint (e.g., Hip)

### Step 1: Add muscles to `muscle-bank.ts`

```typescript
// HIP MUSCLES
{ id: "gluteus-maximus", label: "Gluteus maximus", joints: ["hip"] },
{ id: "gluteus-medius", label: "Gluteus medius", joints: ["hip"] },
{ id: "gluteus-minimus", label: "Gluteus minimus", joints: ["hip"] },
{ id: "psoas-major", label: "Psoas major", joints: ["hip", "spine"] },
{ id: "iliacus", label: "Iliacus", joints: ["hip"] },
{ id: "rectus-femoris", label: "Rectus femoris", joints: ["hip", "knee"] },
{ id: "sartorius", label: "Sartorius", joints: ["hip", "knee"] },
{ id: "tensor-fasciae-latae", label: "Tensor fasciae latae", joints: ["hip"] },
{ id: "pectineus", label: "Pectineus", joints: ["hip"] },
{ id: "adductor-longus", label: "Adductor longus", joints: ["hip"] },
{ id: "adductor-brevis", label: "Adductor brevis", joints: ["hip"] },
{ id: "adductor-magnus", label: "Adductor magnus", joints: ["hip"] },
{ id: "gracilis", label: "Gracilis", joints: ["hip", "knee"] },
{ id: "biceps-femoris", label: "Biceps femoris", joints: ["hip", "knee"] },
{ id: "semitendinosus", label: "Semitendinosus", joints: ["hip", "knee"] },
{ id: "semimembranosus", label: "Semimembranosus", joints: ["hip", "knee"] },
{ id: "piriformis", label: "Piriformis", joints: ["hip"] },
// Note: biceps-femoris already exists for knee, just add "hip" to its joints array
```

### Step 2: Add mappings to `joint-muscle-mappings.ts`

From Table 4.2, add each movement:

```typescript
// HIP EXTENSION
{
  joint: "hip",
  movement: "hip-extension",
  movementLabel: "Extension",
  primeMovers: ["Gluteus maximus", "Semitendinosus", "Semimembranosus", "Biceps femoris"],
  assistantMovers: ["Adductor magnus (posterior fibers)"],
  plane: "sagittal",
  axis: "frontal",
},
// HIP FLEXION
{
  joint: "hip",
  movement: "hip-flexion",
  movementLabel: "Flexion",
  primeMovers: ["Psoas major", "Iliacus", "Pectineus", "Rectus femoris"],
  assistantMovers: ["Adductor brevis", "Adductor longus", "Adductor magnus (anterior)", "Tensor fasciae latae", "Sartorius"],
  plane: "sagittal",
  axis: "frontal",
},
// HIP ABDUCTION
{
  joint: "hip",
  movement: "hip-abduction",
  movementLabel: "Abduction",
  primeMovers: ["Gluteus medius", "Gluteus minimus", "Tensor fasciae latae"],
  assistantMovers: ["Gluteus maximus (superior fibers)", "Psoas major", "Iliacus", "Sartorius"],
  plane: "frontal",
  axis: "sagittal",
},
// Continue for: hip-adduction, hip-medial-rotation, hip-lateral-rotation
```

### Step 3: Add scenarios to `scenarios.ts`

```typescript
{
  id: "squat-down-hip",
  exerciseName: "Back Squat",
  phase: "downward",
  joint: "hip",
  jointLabel: "Hip Joint",
  description: "During the downward (descent) phase of a back squat, analyze the hip joint. The person is standing and slowly lowering into a squat position.",
  correctAnswers: {
    step1: { joint: "hip", action: "flexion" },
    step2: { resistanceType: "gravity", direction: "downward" },
    step3: "eccentric",
    step4_plane: "sagittal",
    step4_axis: "frontal",
    step5_shortening: "anterior",
    step5_lengthening: "posterior",
    step6_primeMovers: ["Gluteus maximus", "Semitendinosus", "Semimembranosus", "Biceps femoris"],
    step6_assistantMovers: ["Adductor magnus (posterior fibers)"],
  },
  explanations: {
    step1: "The hip is flexing as the torso moves closer to the thighs during descent.",
    step2: "Gravity pulls the body downward. This is what the muscles must control.",
    step3: "The hip extensors are lengthening while producing force to control the descent - eccentric action.",
    step4: "Hip flexion/extension occurs in the sagittal plane around a frontal axis.",
    step5: "During hip flexion, the anterior side shortens and the posterior side lengthens.",
    step6: "The hip EXTENSORS (glutes and hamstrings) work eccentrically to control the flexion. They are on the lengthening (posterior) side.",
  },
},
```

---

## Quick Reference: Table 4.2 Data

### Hip Joint
| Movement | Prime Movers | Assistants | Plane/Axis |
|----------|--------------|------------|------------|
| Extension | Gluteus maximus, Hamstrings | Adductor magnus (post) | Sagittal/Frontal |
| Flexion | Psoas, Iliacus, Pectineus, Rectus femoris | Adductors, TFL, Sartorius | Sagittal/Frontal |
| Abduction | Glute med/min, TFL | Glute max (sup), Sartorius | Frontal/Sagittal |
| Adduction | Adductors, Pectineus, Gracilis | Glute max (inf), Biceps femoris | Frontal/Sagittal |

### Knee Joint
| Movement | Prime Movers | Assistants | Plane/Axis |
|----------|--------------|------------|------------|
| Extension | Quadriceps (4 heads) | - | Sagittal/Frontal |
| Flexion | Hamstrings | Gracilis, Sartorius, Popliteus, Gastroc | Sagittal/Frontal |

### Shoulder (Glenohumeral)
| Movement | Prime Movers | Assistants | Plane/Axis |
|----------|--------------|------------|------------|
| Flexion | Anterior deltoid, Pec major (clav) | Biceps (long head), Coracobrachialis | Sagittal/Frontal |
| Extension | Lat dorsi, Teres major, Pec major (stern) | Post deltoid, Triceps (long) | Sagittal/Frontal |
| Abduction | Middle deltoid, Supraspinatus | Anterior deltoid, Biceps | Frontal/Sagittal |
| Adduction | Lat dorsi, Teres major, Pec major | - | Frontal/Sagittal |

---

## Validation Rules (Step 6)

- **Pass**: All prime movers selected, no wrong muscles
- **Mastery**: Pass + all assistant movers
- **Fail**: Missing any prime mover OR selected antagonist

---

## Scenario Ideas by Joint

### Hip
- Back Squat (up/down)
- Deadlift (up/down)
- Hip Thrust (up/down)
- Lunges (up/down)
- Leg Press (up/down)

### Knee
- Leg Extension machine (up/down)
- Leg Curl machine (up/down)
- Squat (up/down) - knee focus

### Shoulder
- Overhead Press (up/down)
- Lateral Raise (up/down)
- Bench Press (up/down)
- Lat Pulldown (pull/return)
- Rows (pull/return)

### Elbow (done)
- Bicep Curl (up/down) ✓
- Tricep Pushdown (down/up)
- Skull Crushers (up/down)
