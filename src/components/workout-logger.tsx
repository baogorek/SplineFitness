"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Activity, Clock, Timer, Target, CheckCircle2, ChevronRight } from "lucide-react"

// Types
type WorkoutType = "A" | "B"

interface SetData {
  id: number
  weight: string
  reps: string
  rpe: string
}

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  prescribedSets: number
  prescribedReps: number
  restPeriod: string
  sets: SetData[]
}

// RPE Options
const rpeOptions = [
  { value: "6", label: "RPE 6 — Easy" },
  { value: "7", label: "RPE 7 — Moderate" },
  { value: "8", label: "RPE 8 — Hard" },
  { value: "9", label: "RPE 9 — Very Hard" },
  { value: "10", label: "RPE 10 — Failure" },
]

// Workout Data
const workoutAExercises: Exercise[] = [
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    muscleGroup: "Quadriceps • Glutes",
    prescribedSets: 3,
    prescribedReps: 12,
    restPeriod: "90s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
    ],
  },
  {
    id: "push-up",
    name: "Push Up",
    muscleGroup: "Chest • Triceps • Anterior Deltoid",
    prescribedSets: 3,
    prescribedReps: 15,
    restPeriod: "60s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
    ],
  },
  {
    id: "inverted-row",
    name: "Inverted Row",
    muscleGroup: "Lats • Rhomboids • Biceps",
    prescribedSets: 3,
    prescribedReps: 10,
    restPeriod: "90s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
    ],
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroup: "Hamstrings • Glutes • Erectors",
    prescribedSets: 3,
    prescribedReps: 10,
    restPeriod: "120s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
    ],
  },
]

const workoutBExercises: Exercise[] = [
  {
    id: "db-bench-press",
    name: "Dumbbell Bench Press",
    muscleGroup: "Chest • Triceps",
    prescribedSets: 4,
    prescribedReps: 10,
    restPeriod: "120s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
      { id: 4, weight: "", reps: "", rpe: "" },
    ],
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroup: "Lats • Biceps • Rear Deltoid",
    prescribedSets: 4,
    prescribedReps: 12,
    restPeriod: "90s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
      { id: 4, weight: "", reps: "", rpe: "" },
    ],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroup: "Quadriceps • Glutes",
    prescribedSets: 3,
    prescribedReps: 15,
    restPeriod: "120s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
    ],
  },
  {
    id: "shoulder-press",
    name: "Seated Shoulder Press",
    muscleGroup: "Deltoids • Triceps",
    prescribedSets: 3,
    prescribedReps: 10,
    restPeriod: "90s",
    sets: [
      { id: 1, weight: "", reps: "", rpe: "" },
      { id: 2, weight: "", reps: "", rpe: "" },
      { id: 3, weight: "", reps: "", rpe: "" },
    ],
  },
]

// Header Component
function WorkoutHeader({
  activeWorkout,
  setActiveWorkout,
  completedSets,
  totalSets,
}: {
  activeWorkout: WorkoutType
  setActiveWorkout: (workout: WorkoutType) => void
  completedSets: number
  totalSets: number
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">HYPERTRACK</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">00:32:15</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveWorkout("A")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeWorkout === "A"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Workout A
            </button>
            <button
              onClick={() => setActiveWorkout("B")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeWorkout === "B"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Workout B
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Progress</p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {completedSets}/{totalSets} sets
              </p>
            </div>
            <div className="h-10 w-10 relative">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-primary transition-all duration-500"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(completedSets / totalSets) * 88} 88`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                {Math.round((completedSets / totalSets) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  index,
  updateSetData,
}: {
  exercise: Exercise
  index: number
  updateSetData: (exerciseId: string, setId: number, field: keyof SetData, value: string) => void
}) {
  const completedSets = exercise.sets.filter((set) => set.weight !== "" && set.reps !== "" && set.rpe !== "").length

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-mono text-sm font-bold">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground leading-tight">{exercise.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{exercise.muscleGroup}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            <span className="font-mono">{exercise.restPeriod}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Prescribed:{" "}
            <span className="font-mono font-medium">
              {exercise.prescribedSets} sets @ {exercise.prescribedReps} reps
            </span>
          </span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {completedSets}/{exercise.prescribedSets} logged
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 mb-2 px-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Set</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Weight</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Reps</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">RPE</div>
        </div>

        <div className="space-y-2">
          {exercise.sets.map((set) => {
            const isComplete = set.weight !== "" && set.reps !== "" && set.rpe !== ""
            const isActive = set.weight !== "" || set.reps !== "" || set.rpe !== ""

            return (
              <div
                key={set.id}
                className={`grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center rounded-md p-1 transition-colors ${
                  isComplete ? "bg-primary/5" : isActive ? "bg-primary/5" : "bg-transparent"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                    isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {set.id}
                </div>

                <div className="relative">
                  <Input
                    type="number"
                    placeholder="—"
                    value={set.weight}
                    onChange={(e) => updateSetData(exercise.id, set.id, "weight", e.target.value)}
                    className={`h-8 text-sm font-mono pr-8 ${set.weight ? "border-primary/30 bg-primary/5" : ""}`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    lbs
                  </span>
                </div>

                <Input
                  type="number"
                  placeholder="—"
                  value={set.reps}
                  onChange={(e) => updateSetData(exercise.id, set.id, "reps", e.target.value)}
                  className={`h-8 text-sm font-mono ${set.reps ? "border-primary/30 bg-primary/5" : ""}`}
                />

                <Select value={set.rpe} onValueChange={(value) => updateSetData(exercise.id, set.id, "rpe", value)}>
                  <SelectTrigger className={`h-8 text-xs ${set.rpe ? "border-primary/30 bg-primary/5" : ""}`}>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {rpeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Footer Component
function WorkoutFooter({ completedSets, totalSets }: { completedSets: number; totalSets: number }) {
  const progress = (completedSets / totalSets) * 100
  const isComplete = completedSets === totalSets

  return (
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
            isComplete ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90"
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
  )
}

// Main Workout Logger Component
export function WorkoutLogger() {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutType>("A")
  const [exercisesA, setExercisesA] = useState<Exercise[]>(workoutAExercises)
  const [exercisesB, setExercisesB] = useState<Exercise[]>(workoutBExercises)

  const exercises = activeWorkout === "A" ? exercisesA : exercisesB
  const setExercises = activeWorkout === "A" ? setExercisesA : setExercisesB

  const updateSetData = (exerciseId: string, setId: number, field: keyof SetData, value: string) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
            }
          : exercise,
      ),
    )
  }

  const completedSets = exercises.reduce((acc, exercise) => {
    return acc + exercise.sets.filter((set) => set.weight !== "" && set.reps !== "" && set.rpe !== "").length
  }, 0)

  const totalSets = exercises.reduce((acc, exercise) => acc + exercise.sets.length, 0)

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <WorkoutHeader
        activeWorkout={activeWorkout}
        setActiveWorkout={setActiveWorkout}
        completedSets={completedSets}
        totalSets={totalSets}
      />

      <div className="flex-1 px-4 py-6 space-y-4">
        {exercises.map((exercise, index) => (
          <ExerciseCard key={exercise.id} exercise={exercise} index={index} updateSetData={updateSetData} />
        ))}
      </div>

      <WorkoutFooter completedSets={completedSets} totalSets={totalSets} />
    </div>
  )
}
