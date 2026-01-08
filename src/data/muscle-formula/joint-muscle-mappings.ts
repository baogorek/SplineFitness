import { JointMuscleMapping } from "@/types/muscle-formula"

export const jointMuscleMappings: JointMuscleMapping[] = [
  // ELBOW JOINT (MVP - start here)
  {
    joint: "elbow",
    movement: "elbow-flexion",
    movementLabel: "Flexion",
    primeMovers: ["Biceps brachii", "Brachialis", "Brachioradialis"],
    assistantMovers: ["Pronator teres"],
    plane: "sagittal",
    axis: "frontal",
  },
  {
    joint: "elbow",
    movement: "elbow-extension",
    movementLabel: "Extension",
    primeMovers: ["Triceps brachii"],
    assistantMovers: ["Anconeus"],
    plane: "sagittal",
    axis: "frontal",
  },

  // HIP JOINT
  {
    joint: "hip",
    movement: "hip-extension",
    movementLabel: "Extension",
    primeMovers: ["Gluteus maximus", "Semitendinosus", "Semimembranosus", "Biceps femoris"],
    assistantMovers: ["Adductor magnus (posterior fibers)"],
    plane: "sagittal",
    axis: "frontal",
  },
  {
    joint: "hip",
    movement: "hip-flexion",
    movementLabel: "Flexion",
    primeMovers: ["Psoas major", "Iliacus", "Pectineus", "Rectus femoris"],
    assistantMovers: ["Adductor brevis", "Adductor longus", "Adductor magnus (anterior fibers)", "Tensor fasciae latae", "Sartorius"],
    plane: "sagittal",
    axis: "frontal",
  },
  {
    joint: "hip",
    movement: "hip-abduction",
    movementLabel: "Abduction",
    primeMovers: ["Gluteus medius", "Gluteus minimus", "Tensor fasciae latae"],
    assistantMovers: ["Gluteus maximus (superior fibers)", "Psoas major", "Iliacus", "Sartorius"],
    plane: "frontal",
    axis: "sagittal",
  },
  {
    joint: "hip",
    movement: "hip-adduction",
    movementLabel: "Adduction",
    primeMovers: ["Pectineus", "Adductor brevis", "Adductor longus", "Adductor magnus", "Gracilis"],
    assistantMovers: ["Gluteus maximus (inferior fibers)", "Biceps femoris", "Quadratus femoris"],
    plane: "frontal",
    axis: "sagittal",
  },
  {
    joint: "hip",
    movement: "hip-medial-rotation",
    movementLabel: "Medial Rotation",
    primeMovers: ["Gluteus minimus (anterior fibers)", "Gluteus medius (anterior fibers)", "Tensor fasciae latae"],
    assistantMovers: ["Pectineus", "Adductor brevis", "Adductor longus", "Adductor magnus (anterior fibers)"],
    plane: "transverse",
    axis: "longitudinal",
  },
  {
    joint: "hip",
    movement: "hip-lateral-rotation",
    movementLabel: "Lateral Rotation",
    primeMovers: ["Gluteus maximus", "Piriformis", "Gemellus superior", "Obturator internus"],
    assistantMovers: ["Gemellus inferior", "Obturator externus", "Quadratus femoris", "Psoas major", "Iliacus", "Sartorius"],
    plane: "transverse",
    axis: "longitudinal",
  },

  // KNEE JOINT
  {
    joint: "knee",
    movement: "knee-extension",
    movementLabel: "Extension",
    primeMovers: ["Vastus medialis", "Vastus intermedius", "Vastus lateralis", "Rectus femoris"],
    assistantMovers: [],
    plane: "sagittal",
    axis: "frontal",
  },
  {
    joint: "knee",
    movement: "knee-flexion",
    movementLabel: "Flexion",
    primeMovers: ["Semimembranosus", "Semitendinosus", "Biceps femoris"],
    assistantMovers: ["Sartorius", "Gracilis", "Popliteus", "Gastrocnemius", "Plantaris"],
    plane: "sagittal",
    axis: "frontal",
  },
  {
    joint: "knee",
    movement: "knee-medial-rotation",
    movementLabel: "Medial Rotation",
    primeMovers: ["Popliteus", "Semimembranosus", "Semitendinosus"],
    assistantMovers: ["Sartorius", "Gracilis"],
    plane: "transverse",
    axis: "longitudinal",
  },
  {
    joint: "knee",
    movement: "knee-lateral-rotation",
    movementLabel: "Lateral Rotation",
    primeMovers: ["Biceps femoris"],
    assistantMovers: [],
    plane: "transverse",
    axis: "longitudinal",
  },

  // SHOULDER JOINT, ANKLE, etc. to be added later
]

export function getMusclesForMovement(joint: string, action: string): JointMuscleMapping | undefined {
  const movement = `${joint}-${action}` as JointMuscleMapping["movement"]
  return jointMuscleMappings.find(m => m.movement === movement)
}

export function getMovementsForJoint(joint: string): JointMuscleMapping[] {
  return jointMuscleMappings.filter(m => m.joint === joint)
}
