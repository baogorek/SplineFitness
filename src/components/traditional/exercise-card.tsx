"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Timer, Target } from "lucide-react"
import { TraditionalExercise, TraditionalSetData } from "@/types/workout"
import { rpeOptions } from "@/data/traditional-workouts"

interface ExerciseCardProps {
  exercise: TraditionalExercise
  index: number
  updateSetData: (
    exerciseId: string,
    setId: number,
    field: keyof TraditionalSetData,
    value: string
  ) => void
}

export function ExerciseCard({ exercise, index, updateSetData }: ExerciseCardProps) {
  const completedSets = exercise.sets.filter(
    (set) => set.weight !== "" && set.reps !== "" && set.rpe !== ""
  ).length

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-mono text-sm font-bold">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {exercise.name}
              </h3>
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
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Set
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Weight
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Reps
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            RPE
          </div>
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
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
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
                    className={`h-8 text-sm font-mono pr-8 ${
                      set.weight ? "border-primary/30 bg-primary/5" : ""
                    }`}
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
                  className={`h-8 text-sm font-mono ${
                    set.reps ? "border-primary/30 bg-primary/5" : ""
                  }`}
                />

                <Select
                  value={set.rpe}
                  onValueChange={(value) => updateSetData(exercise.id, set.id, "rpe", value)}
                >
                  <SelectTrigger
                    className={`h-8 text-xs ${set.rpe ? "border-primary/30 bg-primary/5" : ""}`}
                  >
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
