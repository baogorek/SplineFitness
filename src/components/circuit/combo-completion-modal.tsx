"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Combo, ComboCompletionResult, SubExercise } from "@/types/workout"

interface ComboCompletionModalProps {
  combo: Combo
  exerciseChoices?: Record<string, "main" | "alternative">
  onSave: (result: ComboCompletionResult) => void
}

function resolveExerciseName(
  sub: SubExercise,
  exerciseChoices?: Record<string, "main" | "alternative">
): string {
  if (sub.alternative && exerciseChoices?.[sub.id] === "alternative") {
    return sub.alternative.name
  }
  if (sub.alternative && sub.defaultChoice === "alternative" && !exerciseChoices?.[sub.id]) {
    return sub.alternative.name
  }
  return sub.name
}

export function ComboCompletionModal({
  combo,
  exerciseChoices,
  onSave,
}: ComboCompletionModalProps) {
  const [completedWithoutStopping, setCompletedWithoutStopping] = useState<
    boolean | null
  >(null)
  const [weakLinkExerciseId, setWeakLinkExerciseId] = useState<string | null>(null)

  const handleSubmit = () => {
    if (completedWithoutStopping === null) return

    const result: ComboCompletionResult = {
      comboId: combo.id,
      completedWithoutStopping,
    }

    if (!completedWithoutStopping && weakLinkExerciseId) {
      result.weakLinkExerciseId = weakLinkExerciseId
    }

    onSave(result)
  }

  const canSubmit =
    completedWithoutStopping !== null &&
    (completedWithoutStopping || weakLinkExerciseId !== null)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 border-border bg-card max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Combo Complete!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                How did it go?
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {combo.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Did you complete without stopping?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setCompletedWithoutStopping(true)
                  setWeakLinkExerciseId(null)
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  completedWithoutStopping === true
                    ? "border-green-500 bg-green-500/10 text-green-500"
                    : "border-border hover:border-green-500/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Yes!</span>
              </button>
              <button
                onClick={() => {
                  setCompletedWithoutStopping(false)
                  if (combo.subExercises.length === 1) {
                    setWeakLinkExerciseId(combo.subExercises[0].id)
                  }
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  completedWithoutStopping === false
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-border hover:border-amber-500/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <XCircle className="h-5 w-5" />
                <span className="font-medium">No</span>
              </button>
            </div>
          </div>

          {completedWithoutStopping === false && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm font-medium text-foreground">
                Which exercise was your weak link?
              </p>
              <div className="space-y-2">
                {combo.subExercises.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setWeakLinkExerciseId(sub.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                      weakLinkExerciseId === sub.id
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border hover:border-amber-500/50"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        weakLinkExerciseId === sub.id
                          ? "border-amber-500"
                          : "border-muted-foreground"
                      }`}
                    >
                      {weakLinkExerciseId === sub.id && (
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        weakLinkExerciseId === sub.id
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {resolveExerciseName(sub, exerciseChoices)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 text-base font-semibold"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
