"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Star } from "lucide-react"
import { MovementScenario } from "@/types/muscle-formula"
import { formulaSteps } from "@/data/muscle-formula/formula-steps"
import { cn } from "@/lib/utils"

interface StepReviewProps {
  scenario: MovementScenario
  stepResults: (boolean | null)[]
  onTryAnother: () => void
  onRetry: () => void
}

export function StepReview({
  scenario,
  stepResults,
  onTryAnother,
  onRetry,
}: StepReviewProps) {
  const correctCount = stepResults.filter(r => r === true).length
  const totalSteps = stepResults.length
  const allCorrect = correctCount === totalSteps
  const percentage = Math.round((correctCount / totalSteps) * 100)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {allCorrect ? (
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Star className="w-8 h-8 text-green-600 dark:text-green-400 fill-current" />
            </div>
          ) : percentage >= 50 ? (
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl">
          {allCorrect ? "Perfect!" : percentage >= 50 ? "Good Progress!" : "Keep Practicing!"}
        </CardTitle>
        <p className="text-muted-foreground">
          {scenario.exerciseName} - {scenario.phase === "upward" ? "Upward" : "Downward"} Phase - {scenario.jointLabel}
        </p>
        <div className="text-3xl font-bold mt-2">
          {correctCount}/{totalSteps} <span className="text-lg font-normal text-muted-foreground">({percentage}%)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {formulaSteps.map((step, index) => {
            const isCorrect = stepResults[index]
            const explanation = scenario.explanations[`step${step.id}` as keyof typeof scenario.explanations]

            return (
              <div
                key={step.id}
                className={cn(
                  "p-4 rounded-lg border",
                  isCorrect ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
                )}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Step {step.id}</Badge>
                      <span className="font-medium">{step.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{explanation}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onRetry} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Retry This Scenario
          </Button>
          <Button onClick={onTryAnother} className="flex-1 gap-2">
            Try Another
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
