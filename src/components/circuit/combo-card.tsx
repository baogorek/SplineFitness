"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Play, Clock } from "lucide-react"
import { Combo, ExerciseSetting, ComboCompletionResult } from "@/types/workout"
import { cn } from "@/lib/utils"

interface ComboCardProps {
  combo: Combo
  index: number
  isActive: boolean
  isCompleted: boolean
  exerciseSettings?: Record<string, ExerciseSetting>
  completionResult?: ComboCompletionResult
  onClick?: () => void
}

export function ComboCard({
  combo,
  index,
  isActive,
  isCompleted,
  exerciseSettings,
  completionResult,
  onClick,
}: ComboCardProps) {
  const totalDuration = useMemo(() => {
    return combo.subExercises.reduce((sum, sub) => {
      return sum + (exerciseSettings?.[sub.id]?.durationSeconds || 60)
    }, 0)
  }, [combo.subExercises, exerciseSettings])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:00`
  }
  return (
    <Card
      className={cn(
        "border-border bg-card overflow-hidden transition-all duration-200 cursor-pointer",
        isActive && "ring-2 ring-primary border-primary",
        isCompleted && "opacity-75"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold transition-colors",
                isCompleted
                  ? "bg-green-600 text-white"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isActive ? (
                <Play className="h-4 w-4" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {combo.category}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && completionResult && (
              <span
                className={cn(
                  "text-xs font-medium",
                  completionResult.completedWithoutStopping
                    ? "text-green-500"
                    : "text-amber-500"
                )}
              >
                {completionResult.completedWithoutStopping ? "Complete" : "Stopped"}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3">
        <div className="space-y-1.5">
          {combo.subExercises.map((sub, subIndex) => (
            <div key={sub.id} className="flex items-center gap-2">
              <Circle
                className={cn(
                  "h-2 w-2 flex-shrink-0",
                  isCompleted
                    ? "fill-green-600 text-green-600"
                    : isActive
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted"
                )}
              />
              <span
                className={cn(
                  "text-sm flex-1",
                  isCompleted
                    ? "text-muted-foreground"
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {sub.name}
              </span>
              {exerciseSettings?.[sub.id] && exerciseSettings[sub.id].durationSeconds !== 60 && (
                <span className="text-xs text-muted-foreground font-mono">
                  {exerciseSettings[sub.id].durationSeconds}s
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
