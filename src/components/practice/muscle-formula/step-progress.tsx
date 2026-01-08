"use client"

import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, Circle } from "lucide-react"

interface StepProgressProps {
  currentStep: number
  stepResults: (boolean | null)[]
  totalSteps?: number
}

export function StepProgress({ currentStep, stepResults, totalSteps = 6 }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1
        const result = stepResults[i]
        const isCurrent = stepNum === currentStep
        const isCompleted = result !== null

        return (
          <div key={stepNum} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                isCurrent && "ring-2 ring-primary ring-offset-2",
                isCompleted && result && "bg-green-500 text-white",
                isCompleted && !result && "bg-red-500 text-white",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                !isCompleted && isCurrent && "bg-primary text-primary-foreground"
              )}
            >
              {isCompleted ? (
                result ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )
              ) : (
                stepNum
              )}
            </div>
            {stepNum < totalSteps && (
              <div
                className={cn(
                  "w-6 h-0.5 mx-1",
                  isCompleted ? (result ? "bg-green-500" : "bg-red-500") : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
