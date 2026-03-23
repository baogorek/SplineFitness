"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, X } from "lucide-react"
import { FreeformExercise, FreeformSetData } from "@/types/workout"
import { FREEFORM_TAGS } from "@/data/freeform-tags"

interface FreeformExerciseCardProps {
  exercise: FreeformExercise
  onUpdate: (updated: FreeformExercise) => void
  onRemove: () => void
}

export function FreeformExerciseCard({ exercise, onUpdate, onRemove }: FreeformExerciseCardProps) {
  const isBodyweight = exercise.tags.includes("bodyweight")

  const toggleTag = (tag: string) => {
    const tags = exercise.tags.includes(tag)
      ? exercise.tags.filter((t) => t !== tag)
      : [...exercise.tags, tag]
    const updated = { ...exercise, tags }
    if (tag === "bodyweight" && tags.includes("bodyweight")) {
      updated.sets = updated.sets.map((s) => ({ ...s, weight: "" }))
    }
    onUpdate(updated)
  }

  const addSet = () => {
    const newSet: FreeformSetData = {
      id: exercise.sets.length + 1,
      weight: "",
      reps: "",
    }
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] })
  }

  const updateSet = (setId: number, field: keyof FreeformSetData, value: string) => {
    onUpdate({
      ...exercise,
      sets: exercise.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
    })
  }

  const removeSet = (setId: number) => {
    onUpdate({
      ...exercise,
      sets: exercise.sets.filter((s) => s.id !== setId),
    })
  }

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Input
            value={exercise.name}
            onChange={(e) => onUpdate({ ...exercise, name: e.target.value })}
            placeholder="Exercise name..."
            className="text-base font-semibold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
          />
          <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FREEFORM_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={exercise.tags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer text-xs capitalize"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {exercise.sets.length > 0 && (
          <div className="space-y-2">
            <div className={`grid ${isBodyweight ? "grid-cols-[40px_1fr_32px]" : "grid-cols-[40px_1fr_1fr_32px]"} gap-2 px-1`}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Set</div>
              {!isBodyweight && <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Weight</div>}
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Reps</div>
              <div />
            </div>
            {exercise.sets.map((set) => (
              <div key={set.id} className={`grid ${isBodyweight ? "grid-cols-[40px_1fr_32px]" : "grid-cols-[40px_1fr_1fr_32px]"} gap-2 items-center`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                  {set.id}
                </div>
                {!isBodyweight && (
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="—"
                      value={set.weight}
                      onChange={(e) => updateSet(set.id, "weight", e.target.value)}
                      className="h-8 text-sm font-mono pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">lbs</span>
                  </div>
                )}
                <Input
                  type="number"
                  placeholder="—"
                  value={set.reps}
                  onChange={(e) => updateSet(set.id, "reps", e.target.value)}
                  className="h-8 text-sm font-mono"
                />
                <Button variant="ghost" size="icon" onClick={() => removeSet(set.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={addSet} className="text-xs text-muted-foreground">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  )
}
