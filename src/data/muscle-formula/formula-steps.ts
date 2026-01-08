import { FormulaStep } from "@/types/muscle-formula"

export const formulaSteps: FormulaStep[] = [
  {
    id: 1,
    title: "Joint Movement",
    questionPrompt: "What movement is occurring at the {joint} during this phase?",
    helpText: "Consider: Is the joint flexing, extending, abducting, adducting, or rotating?",
  },
  {
    id: 2,
    title: "Source of Resistance",
    questionPrompt: "What is providing resistance, and in which direction?",
    helpText: "Identify the resistance type (gravity, cable, elastic) and the direction it pulls/pushes.",
  },
  {
    id: 3,
    title: "Muscle Action",
    questionPrompt: "Based on the movement and resistance, is the muscle action concentric or eccentric?",
    helpText: "Concentric = muscles shorten while producing force (working against resistance). Eccentric = muscles lengthen while producing force (controlling with resistance).",
  },
  {
    id: 4,
    title: "Plane & Axis",
    questionPrompt: "In which plane does this movement occur, and around which axis?",
    helpText: "Sagittal plane (forward/back) uses frontal axis. Frontal plane (side to side) uses sagittal axis. Transverse plane (rotation) uses longitudinal axis.",
  },
  {
    id: 5,
    title: "Shortening & Lengthening",
    questionPrompt: "Which side of the joint is shortening and which is lengthening?",
    helpText: "The muscles on the shortening side cause this movement concentrically. The muscles on the lengthening side control the opposite movement eccentrically.",
  },
  {
    id: 6,
    title: "Name the Muscles",
    questionPrompt: "Based on the muscle action and which side is active, which muscles are working?",
    helpText: "For concentric action: select muscles on the shortening side. For eccentric action: select muscles on the lengthening side (they control the opposite movement).",
  },
]

export function getStepById(id: number): FormulaStep | undefined {
  return formulaSteps.find(s => s.id === id)
}
