import { MovementScenario } from "@/types/muscle-formula"

export const movementScenarios: MovementScenario[] = [
  // BICEP CURL - MVP scenarios
  {
    id: "bicep-curl-up",
    exerciseName: "Bicep Curl",
    phase: "upward",
    joint: "elbow",
    jointLabel: "Elbow Joint",
    description: "During the upward (lifting) phase of a bicep curl, analyze the elbow joint. The person is standing, holding a dumbbell with arm extended, and curling the weight up toward the shoulder.",
    correctAnswers: {
      step1: { joint: "elbow", action: "flexion" },
      step2: { resistanceType: "gravity", direction: "downward" },
      step3: "concentric",
      step4_plane: "sagittal",
      step4_axis: "frontal",
      step5_shortening: "anterior",
      step5_lengthening: "posterior",
      step6_primeMovers: ["Biceps brachii", "Brachialis", "Brachioradialis"],
      step6_assistantMovers: ["Pronator teres"],
    },
    explanations: {
      step1: "The elbow is flexing as the forearm moves closer to the upper arm, decreasing the angle at the elbow joint.",
      step2: "Gravity pulls the dumbbell downward. This is the resistance that the muscles must overcome to lift the weight.",
      step3: "The elbow flexors are shortening while producing force to lift the weight against gravity. Moving opposite to gravity = Concentric action.",
      step4: "Elbow flexion/extension occurs in the sagittal plane (divides body left/right) around a frontal axis (runs side to side through the elbow).",
      step5: "During elbow flexion, the anterior (front) side of the joint shortens as the forearm approaches the upper arm. The posterior (back) side lengthens.",
      step6: "For concentric elbow flexion, the prime movers are on the anterior side: Biceps brachii, Brachialis, and Brachioradialis. The Pronator teres assists.",
    },
  },
  {
    id: "bicep-curl-down",
    exerciseName: "Bicep Curl",
    phase: "downward",
    joint: "elbow",
    jointLabel: "Elbow Joint",
    description: "During the downward (lowering) phase of a bicep curl, analyze the elbow joint. The person is slowly lowering the dumbbell from the shoulder back to the starting position.",
    correctAnswers: {
      step1: { joint: "elbow", action: "extension" },
      step2: { resistanceType: "gravity", direction: "downward" },
      step3: "eccentric",
      step4_plane: "sagittal",
      step4_axis: "frontal",
      step5_shortening: "posterior",
      step5_lengthening: "anterior",
      step6_primeMovers: ["Biceps brachii", "Brachialis", "Brachioradialis"],
      step6_assistantMovers: ["Pronator teres"],
    },
    explanations: {
      step1: "The elbow is extending as the forearm moves away from the upper arm, increasing the angle at the elbow joint.",
      step2: "Gravity pulls the dumbbell downward, which would cause uncontrolled elbow extension if muscles relaxed.",
      step3: "The elbow flexors are lengthening while producing force to control the descent. Moving with gravity but controlling = Eccentric action.",
      step4: "Elbow extension occurs in the sagittal plane around a frontal axis, same as flexion.",
      step5: "During elbow extension, the posterior side shortens (where the triceps are) and the anterior side lengthens (where the biceps are).",
      step6: "Even though extension is occurring, the ELBOW FLEXORS (Biceps, Brachialis, Brachioradialis) are working eccentrically to control the movement. They are on the lengthening side but producing force.",
    },
  },

  // HIP - BACK SQUAT
  {
    id: "squat-down-hip",
    exerciseName: "Back Squat",
    phase: "downward",
    joint: "hip",
    jointLabel: "Hip Joint",
    description: "During the downward (descent) phase of a back squat, analyze the hip joint. The person is standing with a barbell on their back and slowly lowering into a squat position.",
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
      step2: "Gravity pulls the body and barbell downward. This is the resistance the muscles must control.",
      step3: "The hip extensors are lengthening while producing force to control the descent - eccentric action.",
      step4: "Hip flexion/extension occurs in the sagittal plane around a frontal axis.",
      step5: "During hip flexion, the anterior side shortens and the posterior side lengthens.",
      step6: "The hip EXTENSORS (glutes and hamstrings) work eccentrically to control the flexion. They are on the lengthening (posterior) side.",
    },
  },
  {
    id: "squat-up-hip",
    exerciseName: "Back Squat",
    phase: "upward",
    joint: "hip",
    jointLabel: "Hip Joint",
    description: "During the upward (ascent) phase of a back squat, analyze the hip joint. The person is in the bottom squat position and driving up to standing.",
    correctAnswers: {
      step1: { joint: "hip", action: "extension" },
      step2: { resistanceType: "gravity", direction: "downward" },
      step3: "concentric",
      step4_plane: "sagittal",
      step4_axis: "frontal",
      step5_shortening: "posterior",
      step5_lengthening: "anterior",
      step6_primeMovers: ["Gluteus maximus", "Semitendinosus", "Semimembranosus", "Biceps femoris"],
      step6_assistantMovers: ["Adductor magnus (posterior fibers)"],
    },
    explanations: {
      step1: "The hip is extending as the torso moves away from the thighs during the ascent.",
      step2: "Gravity pulls the body and barbell downward. The muscles must overcome this to stand up.",
      step3: "The hip extensors are shortening while producing force against gravity - concentric action.",
      step4: "Hip extension occurs in the sagittal plane around a frontal axis.",
      step5: "During hip extension, the posterior side shortens (glutes/hamstrings) and the anterior side lengthens.",
      step6: "The hip EXTENSORS (glutes and hamstrings) work concentrically to produce extension. They are on the shortening (posterior) side.",
    },
  },

  // KNEE - BACK SQUAT
  {
    id: "squat-down-knee",
    exerciseName: "Back Squat",
    phase: "downward",
    joint: "knee",
    jointLabel: "Knee Joint",
    description: "During the downward (descent) phase of a back squat, analyze the knee joint. The person is standing with a barbell and slowly lowering into a squat.",
    correctAnswers: {
      step1: { joint: "knee", action: "flexion" },
      step2: { resistanceType: "gravity", direction: "downward" },
      step3: "eccentric",
      step4_plane: "sagittal",
      step4_axis: "frontal",
      step5_shortening: "posterior",
      step5_lengthening: "anterior",
      step6_primeMovers: ["Vastus medialis", "Vastus intermedius", "Vastus lateralis", "Rectus femoris"],
      step6_assistantMovers: [],
    },
    explanations: {
      step1: "The knee is flexing as the lower leg moves closer to the thigh during descent.",
      step2: "Gravity pulls the body and barbell downward, causing the knee to bend.",
      step3: "The knee extensors (quadriceps) are lengthening while producing force to control the descent - eccentric action.",
      step4: "Knee flexion/extension occurs in the sagittal plane around a frontal axis.",
      step5: "During knee flexion, the posterior side shortens and the anterior side (quadriceps) lengthens.",
      step6: "The knee EXTENSORS (quadriceps) work eccentrically to control the flexion. They are on the lengthening (anterior) side.",
    },
  },
  {
    id: "squat-up-knee",
    exerciseName: "Back Squat",
    phase: "upward",
    joint: "knee",
    jointLabel: "Knee Joint",
    description: "During the upward (ascent) phase of a back squat, analyze the knee joint. The person is in the bottom position and driving up to standing.",
    correctAnswers: {
      step1: { joint: "knee", action: "extension" },
      step2: { resistanceType: "gravity", direction: "downward" },
      step3: "concentric",
      step4_plane: "sagittal",
      step4_axis: "frontal",
      step5_shortening: "anterior",
      step5_lengthening: "posterior",
      step6_primeMovers: ["Vastus medialis", "Vastus intermedius", "Vastus lateralis", "Rectus femoris"],
      step6_assistantMovers: [],
    },
    explanations: {
      step1: "The knee is extending as the lower leg moves away from the thigh during the ascent.",
      step2: "Gravity pulls the body and barbell downward. The muscles must overcome this to straighten the knee.",
      step3: "The knee extensors (quadriceps) are shortening while producing force against gravity - concentric action.",
      step4: "Knee extension occurs in the sagittal plane around a frontal axis.",
      step5: "During knee extension, the anterior side (quadriceps) shortens and the posterior side lengthens.",
      step6: "The knee EXTENSORS (quadriceps) work concentrically to produce extension. They are on the shortening (anterior) side.",
    },
  },
]

export function getScenarioById(id: string): MovementScenario | undefined {
  return movementScenarios.find(s => s.id === id)
}

export function getScenariosByExercise(exerciseName: string): MovementScenario[] {
  return movementScenarios.filter(s => s.exerciseName === exerciseName)
}

export function getScenariosByJoint(joint: string): MovementScenario[] {
  return movementScenarios.filter(s => s.joint === joint)
}

export function getRandomScenario(): MovementScenario {
  const randomIndex = Math.floor(Math.random() * movementScenarios.length)
  return movementScenarios[randomIndex]
}

export function getAllExercises(): string[] {
  return [...new Set(movementScenarios.map(s => s.exerciseName))]
}
