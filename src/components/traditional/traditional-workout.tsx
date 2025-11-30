"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { WorkoutVariant, TraditionalExercise, TraditionalSetData } from "@/types/workout"
import { WorkoutHeader } from "@/components/shared/workout-header"
import { ExerciseCard } from "./exercise-card"
import { traditionalWorkouts, createFreshExercises } from "@/data/traditional-workouts"
import { useTimer } from "@/hooks/use-timer"

interface TraditionalWorkoutProps {
  onModeChange: () => void
}

export function TraditionalWorkout({ onModeChange }: TraditionalWorkoutProps) {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutVariant>("A")
  const [exercisesA, setExercisesA] = useState<TraditionalExercise[]>(() =>
    createFreshExercises(traditionalWorkouts.A)
  )
  const [exercisesB, setExercisesB] = useState<TraditionalExercise[]>(() =>
    createFreshExercises(traditionalWorkouts.B)
  )

  const timer = useTimer({ countUp: true })

  useEffect(() => {
    timer.start()
  }, [])

  const exercises = activeWorkout === "A" ? exercisesA : exercisesB
  const setExercises = activeWorkout === "A" ? setExercisesA : setExercisesB

  const updateSetData = (
    exerciseId: string,
    setId: number,
    field: keyof TraditionalSetData,
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      )
    )
  }

  const completedSets = exercises.reduce((acc, exercise) => {
    return (
      acc + exercise.sets.filter((set) => set.weight !== "" && set.reps !== "" && set.rpe !== "").length
    )
  }, 0)

  const totalSets = exercises.reduce((acc, exercise) => acc + exercise.sets.length, 0)
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const isComplete = completedSets === totalSets && totalSets > 0

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <WorkoutHeader
        mode="traditional"
        activeWorkout={activeWorkout}
        setActiveWorkout={setActiveWorkout}
        timerDisplay={timer.formattedTime}
        progressText={`${completedSets}/${totalSets} sets`}
        progressPercent={progress}
        onModeChange={onModeChange}
      />

      <div className="flex-1 px-4 py-6 space-y-4">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            updateSetData={updateSetData}
          />
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Session Progress</span>
              <span className="font-mono font-medium text-foreground">
                {completedSets} of {totalSets} sets complete
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Button
            size="lg"
            className={`w-full h-12 text-sm font-semibold transition-all duration-300 ${
              isComplete
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isComplete ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Complete Workout
              </>
            ) : (
              <>
                Complete Workout
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
