import { MuscleEntry } from "@/types/muscle-formula"

export const MUSCLE_BANK: MuscleEntry[] = [
  // ELBOW MUSCLES (MVP)
  { id: "biceps-brachii", label: "Biceps brachii", joints: ["elbow", "shoulder"] },
  { id: "brachialis", label: "Brachialis", joints: ["elbow"] },
  { id: "brachioradialis", label: "Brachioradialis", joints: ["elbow"] },
  { id: "triceps-brachii", label: "Triceps brachii", joints: ["elbow", "shoulder"] },
  { id: "anconeus", label: "Anconeus", joints: ["elbow"] },
  { id: "pronator-teres", label: "Pronator teres", joints: ["elbow", "radioulnar"] },

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
  { id: "gemellus-superior", label: "Gemellus superior", joints: ["hip"] },
  { id: "gemellus-inferior", label: "Gemellus inferior", joints: ["hip"] },
  { id: "obturator-internus", label: "Obturator internus", joints: ["hip"] },
  { id: "obturator-externus", label: "Obturator externus", joints: ["hip"] },
  { id: "quadratus-femoris", label: "Quadratus femoris", joints: ["hip"] },

  // KNEE MUSCLES (added via hip, plus quadriceps)
  { id: "vastus-medialis", label: "Vastus medialis", joints: ["knee"] },
  { id: "vastus-intermedius", label: "Vastus intermedius", joints: ["knee"] },
  { id: "vastus-lateralis", label: "Vastus lateralis", joints: ["knee"] },
  { id: "popliteus", label: "Popliteus", joints: ["knee"] },
  { id: "gastrocnemius", label: "Gastrocnemius", joints: ["knee", "ankle"] },
  { id: "plantaris", label: "Plantaris", joints: ["knee", "ankle"] },

  // Additional muscles for shoulder, ankle, etc. to be added later
]

export function getMusclesByJoint(joint: string): MuscleEntry[] {
  return MUSCLE_BANK.filter(m => m.joints.includes(joint))
}

export function getMuscleById(id: string): MuscleEntry | undefined {
  return MUSCLE_BANK.find(m => m.id === id)
}

export function getMuscleLabel(id: string): string {
  const muscle = getMuscleById(id)
  return muscle?.label || id
}
