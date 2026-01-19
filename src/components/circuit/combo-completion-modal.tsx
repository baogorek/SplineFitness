"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import { Combo, ExerciseVariation, ComboCompletionResult } from "@/types/workout"
import { VariationSelector } from "./variation-selector"

interface ComboCompletionModalProps {
  combo: Combo
  defaultVariations?: Record<string, ExerciseVariation>
  onSave: (result: ComboCompletionResult, savePreferences: boolean) => void
}

export function ComboCompletionModal({
  combo,
  defaultVariations,
  onSave,
}: ComboCompletionModalProps) {
  const [completedWithoutStopping, setCompletedWithoutStopping] = useState<
    boolean | null
  >(null)
  const [weakLinkExerciseId, setWeakLinkExerciseId] = useState<string | null>(null)
  const [variations, setVariations] = useState<Record<string, ExerciseVariation>>(
    () =>
      Object.fromEntries(
        combo.subExercises.map((sub) => [
          sub.id,
          defaultVariations?.[sub.id] || "standard",
        ])
      )
  )
  const [savePreferences, setSavePreferences] = useState(false)

  const handleVariationChange = (exerciseId: string, variation: ExerciseVariation) => {
    setVariations((prev) => ({ ...prev, [exerciseId]: variation }))
  }

  const handleSubmit = () => {
    if (completedWithoutStopping === null) return

    const result: ComboCompletionResult = {
      comboId: combo.id,
      completedWithoutStopping,
      exerciseVariations: variations,
    }

    if (!completedWithoutStopping && weakLinkExerciseId) {
      result.weakLinkExerciseId = weakLinkExerciseId
    }

    onSave(result, savePreferences)
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
                onClick={() => setCompletedWithoutStopping(false)}
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
                      {sub.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-medium text-foreground">
              What variation did you use?
            </p>
            {combo.subExercises.map((sub) => (
              <div key={sub.id} className="space-y-1.5">
                <span className="text-xs text-muted-foreground">{sub.name}</span>
                <VariationSelector
                  value={variations[sub.id]}
                  onChange={(v) => handleVariationChange(sub.id, v)}
                  defaultVariation={defaultVariations?.[sub.id]}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="save-prefs"
              checked={savePreferences}
              onChange={(e) => setSavePreferences(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label
              htmlFor="save-prefs"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember my variation choices
            </label>
          </div>

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
