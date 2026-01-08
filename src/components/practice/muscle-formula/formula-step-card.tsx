"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, Star } from "lucide-react"
import { FormulaStep, MovementScenario, MuscleAction, MovementPlane, MovementAxis, JointSide, ResistanceType, ResistanceDirection, Step6ValidationResult } from "@/types/muscle-formula"
import { getMovementOptionsForJoint, resistanceTypeOptions, resistanceDirectionOptions, muscleActionOptions, planeOptions, axisOptions, jointSideOptions } from "@/data/muscle-formula/answer-options"
import { getMusclesByJoint } from "@/data/muscle-formula/muscle-bank"
import { cn } from "@/lib/utils"

interface FormulaStepCardProps {
  step: FormulaStep
  scenario: MovementScenario
  onSubmit: (isCorrect: boolean) => void
  onNext: () => void
  showResult: boolean
  isCorrect: boolean | null
}

export function FormulaStepCard({
  step,
  scenario,
  onSubmit,
  onNext,
  showResult,
  isCorrect,
}: FormulaStepCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [step1Answer, setStep1Answer] = useState<{ joint: string; action: string } | null>(null)
  const [step2Answer, setStep2Answer] = useState<{ resistanceType: ResistanceType; direction: ResistanceDirection } | null>(null)
  const [step3Answer, setStep3Answer] = useState<MuscleAction | null>(null)
  const [step4Plane, setStep4Plane] = useState<MovementPlane | null>(null)
  const [step4Axis, setStep4Axis] = useState<MovementAxis | null>(null)
  const [step5Shortening, setStep5Shortening] = useState<JointSide | null>(null)
  const [step5Lengthening, setStep5Lengthening] = useState<JointSide | null>(null)
  const [step6Muscles, setStep6Muscles] = useState<string[]>([])
  const [step6Result, setStep6Result] = useState<Step6ValidationResult | null>(null)

  const questionPrompt = step.questionPrompt.replace("{joint}", scenario.jointLabel)

  const validateAndSubmit = () => {
    let correct = false

    switch (step.id) {
      case 1:
        correct = step1Answer?.joint === scenario.correctAnswers.step1.joint &&
                  step1Answer?.action === scenario.correctAnswers.step1.action
        break
      case 2:
        correct = step2Answer?.resistanceType === scenario.correctAnswers.step2.resistanceType &&
                  step2Answer?.direction === scenario.correctAnswers.step2.direction
        break
      case 3:
        correct = step3Answer === scenario.correctAnswers.step3
        break
      case 4:
        correct = step4Plane === scenario.correctAnswers.step4_plane &&
                  step4Axis === scenario.correctAnswers.step4_axis
        break
      case 5:
        correct = step5Shortening === scenario.correctAnswers.step5_shortening &&
                  step5Lengthening === scenario.correctAnswers.step5_lengthening
        break
      case 6:
        const result = validateStep6(step6Muscles, scenario)
        setStep6Result(result)
        correct = result.status === "success"
        break
    }

    onSubmit(correct)
  }

  const validateStep6 = (userSelection: string[], scenario: MovementScenario): Step6ValidationResult => {
    const required = scenario.correctAnswers.step6_primeMovers
    const optional = scenario.correctAnswers.step6_assistantMovers

    const missingPrimes = required.filter(m => !userSelection.includes(m))
    const wrongPicks = userSelection.filter(m => !required.includes(m) && !optional.includes(m))

    if (missingPrimes.length > 0) {
      return { status: "fail", message: "You missed key prime movers.", missingPrimes, wrongPicks }
    }
    if (wrongPicks.length > 0) {
      return { status: "fail", message: "You selected muscles that don't help this movement.", wrongPicks }
    }

    const gotAllAssistants = optional.every(m => userSelection.includes(m))
    return { status: "success", mastery: gotAllAssistants }
  }

  const canSubmit = () => {
    switch (step.id) {
      case 1: return step1Answer !== null
      case 2: return step2Answer?.resistanceType && step2Answer?.direction
      case 3: return step3Answer !== null
      case 4: return step4Plane !== null && step4Axis !== null
      case 5: return step5Shortening !== null && step5Lengthening !== null
      case 6: return step6Muscles.length > 0
      default: return false
    }
  }

  const renderStepInput = () => {
    switch (step.id) {
      case 1:
        const movementOptions = getMovementOptionsForJoint(scenario.joint)
        return (
          <div className="space-y-2">
            {movementOptions.map(option => (
              <button
                key={option.value}
                onClick={() => !showResult && setStep1Answer({ joint: scenario.joint, action: option.value })}
                disabled={showResult}
                className={cn(
                  "w-full p-3 text-left border rounded-lg transition-all",
                  step1Answer?.action === option.value && !showResult && "border-primary bg-primary/5",
                  showResult && step1Answer?.action === option.value && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                  showResult && step1Answer?.action === option.value && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950",
                  showResult && option.value === scenario.correctAnswers.step1.action && "border-green-500 bg-green-50 dark:bg-green-950",
                  !showResult && step1Answer?.action !== option.value && "hover:border-primary/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Resistance Type</label>
              <div className="grid grid-cols-2 gap-2">
                {resistanceTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => !showResult && setStep2Answer(prev => ({ resistanceType: option.value as ResistanceType, direction: prev?.direction || "downward" }))}
                    disabled={showResult}
                    className={cn(
                      "p-3 text-left border rounded-lg transition-all",
                      step2Answer?.resistanceType === option.value && "border-primary bg-primary/5",
                      showResult && step2Answer?.resistanceType === option.value && option.value === scenario.correctAnswers.step2.resistanceType && "border-green-500 bg-green-50 dark:bg-green-950",
                      showResult && step2Answer?.resistanceType === option.value && option.value !== scenario.correctAnswers.step2.resistanceType && "border-red-500 bg-red-50 dark:bg-red-950",
                      !showResult && "hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Resistance Direction</label>
              <div className="grid grid-cols-3 gap-2">
                {resistanceDirectionOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => !showResult && setStep2Answer(prev => ({ resistanceType: prev?.resistanceType || "gravity", direction: option.value as ResistanceDirection }))}
                    disabled={showResult}
                    className={cn(
                      "p-2 text-sm border rounded-lg transition-all",
                      step2Answer?.direction === option.value && "border-primary bg-primary/5",
                      showResult && step2Answer?.direction === option.value && option.value === scenario.correctAnswers.step2.direction && "border-green-500 bg-green-50 dark:bg-green-950",
                      showResult && step2Answer?.direction === option.value && option.value !== scenario.correctAnswers.step2.direction && "border-red-500 bg-red-50 dark:bg-red-950",
                      !showResult && "hover:border-primary/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-2">
            {muscleActionOptions.map(option => (
              <button
                key={option.value}
                onClick={() => !showResult && setStep3Answer(option.value as MuscleAction)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 text-left border rounded-lg transition-all",
                  step3Answer === option.value && !showResult && "border-primary bg-primary/5",
                  showResult && step3Answer === option.value && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                  showResult && step3Answer === option.value && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950",
                  showResult && option.value === scenario.correctAnswers.step3 && "border-green-500 bg-green-50 dark:bg-green-950",
                  !showResult && "hover:border-primary/50"
                )}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Plane of Movement</label>
              <div className="space-y-2">
                {planeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => !showResult && setStep4Plane(option.value as MovementPlane)}
                    disabled={showResult}
                    className={cn(
                      "w-full p-3 text-left border rounded-lg transition-all",
                      step4Plane === option.value && "border-primary bg-primary/5",
                      showResult && step4Plane === option.value && option.value === scenario.correctAnswers.step4_plane && "border-green-500 bg-green-50 dark:bg-green-950",
                      showResult && step4Plane === option.value && option.value !== scenario.correctAnswers.step4_plane && "border-red-500 bg-red-50 dark:bg-red-950",
                      !showResult && "hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Axis of Rotation</label>
              <div className="space-y-2">
                {axisOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => !showResult && setStep4Axis(option.value as MovementAxis)}
                    disabled={showResult}
                    className={cn(
                      "w-full p-3 text-left border rounded-lg transition-all",
                      step4Axis === option.value && "border-primary bg-primary/5",
                      showResult && step4Axis === option.value && option.value === scenario.correctAnswers.step4_axis && "border-green-500 bg-green-50 dark:bg-green-950",
                      showResult && step4Axis === option.value && option.value !== scenario.correctAnswers.step4_axis && "border-red-500 bg-red-50 dark:bg-red-950",
                      !showResult && "hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        if (scenario.correctAnswers.step5_shortening === null) {
          return (
            <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
              This step is skipped for rotational movements in the transverse plane.
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Which side is SHORTENING?</label>
              <div className="grid grid-cols-2 gap-2">
                {jointSideOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => !showResult && setStep5Shortening(option.value as JointSide)}
                    disabled={showResult}
                    className={cn(
                      "p-3 border rounded-lg transition-all",
                      step5Shortening === option.value && "border-primary bg-primary/5",
                      showResult && step5Shortening === option.value && option.value === scenario.correctAnswers.step5_shortening && "border-green-500 bg-green-50 dark:bg-green-950",
                      showResult && step5Shortening === option.value && option.value !== scenario.correctAnswers.step5_shortening && "border-red-500 bg-red-50 dark:bg-red-950",
                      !showResult && "hover:border-primary/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Which side is LENGTHENING?</label>
              <div className="grid grid-cols-2 gap-2">
                {jointSideOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => !showResult && setStep5Lengthening(option.value as JointSide)}
                    disabled={showResult}
                    className={cn(
                      "p-3 border rounded-lg transition-all",
                      step5Lengthening === option.value && "border-primary bg-primary/5",
                      showResult && step5Lengthening === option.value && option.value === scenario.correctAnswers.step5_lengthening && "border-green-500 bg-green-50 dark:bg-green-950",
                      showResult && step5Lengthening === option.value && option.value !== scenario.correctAnswers.step5_lengthening && "border-red-500 bg-red-50 dark:bg-red-950",
                      !showResult && "hover:border-primary/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        const muscles = getMusclesByJoint(scenario.joint)
        const allCorrect = [...scenario.correctAnswers.step6_primeMovers, ...scenario.correctAnswers.step6_assistantMovers]
        const muscleAction = scenario.correctAnswers.step3
        const activeSide = muscleAction === "concentric"
          ? scenario.correctAnswers.step5_shortening
          : scenario.correctAnswers.step5_lengthening
        const activeSideLabel = activeSide === "anterior" ? "Anterior (Front)"
          : activeSide === "posterior" ? "Posterior (Back)"
          : activeSide === "medial" ? "Medial (Inside)"
          : activeSide === "lateral" ? "Lateral (Outside)"
          : activeSide

        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Apply the Formula:</div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>Step 3: The muscle action is <strong className="text-blue-900 dark:text-blue-100">{muscleAction}</strong></li>
                <li>Step 5: The <strong className="text-blue-900 dark:text-blue-100">{activeSideLabel}</strong> side is {muscleAction === "concentric" ? "shortening" : "lengthening"}</li>
                <li className="pt-1 border-t border-blue-200 dark:border-blue-700">
                  {muscleAction === "concentric"
                    ? <>For <strong>concentric</strong> actions, select muscles on the <strong>shortening</strong> side</>
                    : <>For <strong>eccentric</strong> actions, select muscles on the <strong>lengthening</strong> side (they control the opposite movement)</>
                  }
                </li>
              </ul>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select the working muscles:</label>
              <div className="space-y-2">
                {muscles.map(muscle => {
                  const isSelected = step6Muscles.includes(muscle.label)
                  const isPrimeMover = scenario.correctAnswers.step6_primeMovers.includes(muscle.label)
                  const isAssistant = scenario.correctAnswers.step6_assistantMovers.includes(muscle.label)
                  const isMissedPrime = showResult && isPrimeMover && !isSelected
                  const isWrongPick = showResult && isSelected && !isPrimeMover && !isAssistant

                  return (
                    <button
                      key={muscle.id}
                      onClick={() => {
                        if (showResult) return
                        if (isSelected) {
                          setStep6Muscles(prev => prev.filter(m => m !== muscle.label))
                        } else {
                          setStep6Muscles(prev => [...prev, muscle.label])
                        }
                      }}
                      disabled={showResult}
                      className={cn(
                        "w-full p-3 text-left border rounded-lg transition-all flex items-center gap-3",
                        isSelected && !showResult && "border-primary bg-primary/5",
                        showResult && isSelected && (isPrimeMover || isAssistant) && "border-green-500 bg-green-50 dark:bg-green-950",
                        showResult && isWrongPick && "border-red-500 bg-red-50 dark:bg-red-950 line-through",
                        showResult && isMissedPrime && "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
                        !showResult && "hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 border-2 rounded flex items-center justify-center",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      )}>
                        {isSelected && <CheckCircle className="w-4 h-4" />}
                      </div>
                      <span>{muscle.label}</span>
                      {showResult && isPrimeMover && <Badge variant="default" className="ml-auto">Prime</Badge>}
                      {showResult && isAssistant && <Badge variant="secondary" className="ml-auto">Assistant</Badge>}
                    </button>
                  )
                })}
              </div>
            </div>
            {showResult && step6Result?.mastery && (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">Mastery! You identified all assistants too!</span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const explanation = scenario.explanations[`step${step.id}` as keyof typeof scenario.explanations]

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">Step {step.id} of 6</Badge>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            Help
            {showHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <CardTitle className="text-lg">{step.title}</CardTitle>
        <CardDescription>{questionPrompt}</CardDescription>
        {showHelp && (
          <div className="mt-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            {step.helpText}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {renderStepInput()}

        {!showResult ? (
          <Button onClick={validateAndSubmit} disabled={!canSubmit()} className="w-full">
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg",
                isCorrect
                  ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
              )}
            >
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium mb-1">{isCorrect ? "Correct!" : "Incorrect"}</div>
                <div className="text-sm opacity-90">{explanation}</div>
              </div>
            </div>

            <Button onClick={onNext} className="w-full">
              {step.id === 6 ? "See Results" : "Next Step"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
