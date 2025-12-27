"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { Question } from "@/data/practice-questions"

interface QuizQuestionProps {
  question: Question
  questionNumber: number
  onNext?: () => void
  isLast?: boolean
}

export function QuizQuestion({ question, questionNumber, onNext, isLast }: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSubmit = () => {
    if (selectedAnswer) {
      setShowResult(true)
    }
  }

  const handleNext = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    onNext?.()
  }

  const isCorrect = selectedAnswer === question.correctAnswer

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground mb-2">Question {questionNumber}</div>
        <h2 className={`text-lg font-medium text-foreground ${question.diagram ? "mb-4" : "mb-6"}`}>
          {question.question}
        </h2>

        {question.diagram && (
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto mb-6 font-mono">
            {question.diagram}
          </pre>
        )}

        <div className="space-y-3 mb-6">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.letter
            const isCorrectOption = option.letter === question.correctAnswer

            let optionClasses = "w-full p-4 text-left border rounded-lg transition-all "

            if (showResult) {
              if (isCorrectOption) {
                optionClasses += "border-green-500 bg-green-50 dark:bg-green-950"
              } else if (isSelected && !isCorrect) {
                optionClasses += "border-red-500 bg-red-50 dark:bg-red-950"
              } else {
                optionClasses += "border-muted opacity-50"
              }
            } else {
              optionClasses += isSelected
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50"
            }

            return (
              <button
                key={option.letter}
                onClick={() => !showResult && setSelectedAnswer(option.letter)}
                disabled={showResult}
                className={optionClasses}
              >
                <span className="font-medium mr-3">{option.letter}.</span>
                {option.text}
              </button>
            )
          })}
        </div>

        {!showResult ? (
          <Button onClick={handleSubmit} disabled={!selectedAnswer} className="w-full">
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
              }`}
            >
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium mb-1">{isCorrect ? "Correct!" : "Incorrect"}</div>
                <div className="text-sm opacity-90">{question.explanation}</div>
              </div>
            </div>

            {onNext && (
              <Button onClick={handleNext} className="w-full">
                {isLast ? "Finish" : "Next Question"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
