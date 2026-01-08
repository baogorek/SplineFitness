"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ScenarioSelector } from "./scenario-selector"
import { FormulaStepCard } from "./formula-step-card"
import { StepProgress } from "./step-progress"
import { StepReview } from "./step-review"
import { MovementScenario } from "@/types/muscle-formula"
import { formulaSteps } from "@/data/muscle-formula/formula-steps"

type QuizPhase = "select" | "quiz" | "review"

export function MuscleFormulaQuiz() {
  const [phase, setPhase] = useState<QuizPhase>("select")
  const [selectedScenario, setSelectedScenario] = useState<MovementScenario | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepResults, setStepResults] = useState<(boolean | null)[]>([null, null, null, null, null, null])
  const [showStepResult, setShowStepResult] = useState(false)

  const handleSelectScenario = (scenario: MovementScenario) => {
    setSelectedScenario(scenario)
    setCurrentStep(1)
    setStepResults([null, null, null, null, null, null])
    setShowStepResult(false)
    setPhase("quiz")
  }

  const handleStepSubmit = (isCorrect: boolean) => {
    setStepResults(prev => {
      const newResults = [...prev]
      newResults[currentStep - 1] = isCorrect
      return newResults
    })
    setShowStepResult(true)
  }

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1)
      setShowStepResult(false)
    } else {
      setPhase("review")
    }
  }

  const handleBackToSelect = () => {
    setPhase("select")
    setSelectedScenario(null)
    setCurrentStep(1)
    setStepResults([null, null, null, null, null, null])
    setShowStepResult(false)
  }

  const handleRetry = () => {
    setCurrentStep(1)
    setStepResults([null, null, null, null, null, null])
    setShowStepResult(false)
    setPhase("quiz")
  }

  const currentFormStep = formulaSteps.find(s => s.id === currentStep)

  if (phase === "select") {
    return <ScenarioSelector onSelect={handleSelectScenario} />
  }

  if (phase === "review" && selectedScenario) {
    return (
      <div className="flex flex-col items-center">
        <StepReview
          scenario={selectedScenario}
          stepResults={stepResults}
          onTryAnother={handleBackToSelect}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  if (phase === "quiz" && selectedScenario && currentFormStep) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBackToSelect} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Scenarios
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{selectedScenario.exerciseName}</Badge>
            <Badge variant={selectedScenario.phase === "upward" ? "default" : "secondary"}>
              {selectedScenario.phase === "upward" ? "Upward" : "Downward"} Phase
            </Badge>
            <Badge variant="outline">{selectedScenario.jointLabel}</Badge>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">{selectedScenario.description}</p>
        </div>

        <StepProgress currentStep={currentStep} stepResults={stepResults} />

        <div className="flex justify-center">
          <FormulaStepCard
            key={`${selectedScenario.id}-step-${currentStep}`}
            step={currentFormStep}
            scenario={selectedScenario}
            onSubmit={handleStepSubmit}
            onNext={handleNextStep}
            showResult={showStepResult}
            isCorrect={stepResults[currentStep - 1]}
          />
        </div>
      </div>
    )
  }

  return null
}
