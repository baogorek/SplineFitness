"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Pause, Play, SkipForward, CheckCircle2 } from "lucide-react"
import { WeakLinkEntry, WeakLinkPractice } from "@/types/workout"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"

interface WeakLinkTimerProps {
  exercises: WeakLinkEntry[]
  durationSeconds: number
  onComplete: (practiceRecords: WeakLinkPractice[]) => void
}

export function WeakLinkTimer({
  exercises,
  durationSeconds,
  onComplete,
}: WeakLinkTimerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState<WeakLinkPractice[]>([])
  const audio = useAudio()

  const currentExercise = exercises[currentIndex]
  const isLastExercise = currentIndex === exercises.length - 1

  useEffect(() => {
    audio.startKeepalive()
    return () => { audio.stopKeepalive() }
  }, [audio])

  const timer = useTimer({
    targetSeconds: durationSeconds,
    onTick: (remainingSeconds) => {
      if (remainingSeconds === 10) {
        audio.speak("10 seconds")
      } else if (remainingSeconds >= 1 && remainingSeconds <= 5) {
        const countdownWords = ["one", "two", "three", "four", "five"]
        audio.speak(countdownWords[remainingSeconds - 1])
      }
    },
    onComplete: () => {
      audio.playCompleteSound()
      handleExerciseComplete()
    },
  })

  useEffect(() => {
    if (currentExercise) {
      audio.speak(currentExercise.exerciseName)
      timer.start()
    }
    return () => {
      timer.reset()
    }
  }, [currentIndex])

  const handleExerciseComplete = useCallback(() => {
    const record: WeakLinkPractice = {
      exerciseId: currentExercise.exerciseId,
      exerciseName: currentExercise.exerciseName,
      practiceTimeSeconds: durationSeconds,
      practicedAt: new Date().toISOString(),
    }
    const newCompleted = [...completed, record]
    setCompleted(newCompleted)

    if (isLastExercise) {
      onComplete(newCompleted)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentExercise, durationSeconds, completed, isLastExercise, onComplete])

  const handleSkip = () => {
    timer.reset()
    if (isLastExercise) {
      onComplete(completed)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const progressPercent =
    ((durationSeconds - timer.remainingSeconds) / durationSeconds) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Practicing Weak Link
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {currentExercise?.exerciseName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {exercises.length} exercises
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <svg className="h-64 w-64 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-muted"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-amber-500 transition-all duration-500"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progressPercent * 2.83} 283`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-mono font-bold text-foreground">
              {timer.formattedTime}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={timer.isRunning ? timer.pause : timer.start}
            className="h-14 w-14 rounded-full p-0"
          >
            {timer.isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleSkip}
            className="h-14 px-6"
          >
            <SkipForward className="h-5 w-5 mr-2" />
            {isLastExercise ? "Finish" : "Skip"}
          </Button>
        </div>

        {completed.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Completed
            </p>
            <div className="space-y-1">
              {completed.map((record, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {record.exerciseName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
