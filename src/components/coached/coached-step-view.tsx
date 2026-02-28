"use client"

import { useState } from "react"
import { ExternalLink, ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward, Check } from "lucide-react"
import { CoachedExercise } from "@/types/workout"
import { CoachedStep } from "@/lib/flatten-phase"

interface CoachedStepViewProps {
  step: CoachedStep
  formattedTime: string
  isRunning: boolean
  onPause: () => void
  onResume: () => void
  onDone: () => void
  onBack: () => void
  onSkip: () => void
  canGoBack: boolean
  nextStepPreview: string | null
  stepIndex: number
  totalSteps: number
}

function buildPrescription(ex: CoachedExercise, stepHasSide?: boolean): string {
  const parts: string[] = []
  if (ex.sets) parts.push(`${ex.sets} x`)
  if (ex.reps) parts.push(ex.reps)
  if (ex.holdSeconds) parts.push(`(${ex.holdSeconds}s hold)`)
  if (ex.durationSeconds) {
    const mins = Math.floor(ex.durationSeconds / 60)
    const secs = ex.durationSeconds % 60
    if (mins > 0 && secs > 0) parts.push(`${mins}m ${secs}s`)
    else if (mins > 0) parts.push(`${mins} min`)
    else parts.push(`${secs}s`)
  }
  if (ex.perSide && !stepHasSide) parts.push("per side")
  return parts.join(" ")
}

function buildStepName(step: CoachedStep & { type: "exercise" }): string {
  let name = step.exercise.name
  if (step.side) name = `${name} — ${step.side}`
  if (step.setNumber && step.totalSets) name = `${name} (Set ${step.setNumber}/${step.totalSets})`
  return name
}

function getNextPreviewText(nextStepPreview: string | null): string {
  if (!nextStepPreview) return "Phase complete!"
  return nextStepPreview
}

function NavRow({ onBack, onSkip, canGoBack }: { onBack: () => void; onSkip: () => void; canGoBack: boolean }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <SkipBack className="h-3.5 w-3.5" />
        Back
      </button>
      <button
        onClick={onSkip}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
      >
        Skip
        <SkipForward className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function CoachedStepView({
  step,
  formattedTime,
  isRunning,
  onPause,
  onResume,
  onDone,
  onBack,
  onSkip,
  canGoBack,
  nextStepPreview,
  stepIndex,
  totalSteps,
}: CoachedStepViewProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (step.type === "rest") {
    return (
      <div className="flex flex-col items-center text-center px-4 py-6 space-y-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Step {stepIndex + 1} of {totalSteps}
        </p>

        <div className="text-sm text-purple-400 font-medium">{step.supersetLabel}</div>
        <p className="text-muted-foreground text-sm">
          Rest after round {step.afterRound} of {step.totalRounds}
        </p>

        <div className="text-7xl font-mono font-bold text-foreground tabular-nums">
          {formattedTime}
        </div>

        <button
          onClick={onDone}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors"
        >
          <SkipForward className="h-4 w-4" />
          Skip Rest
        </button>

        <NavRow onBack={onBack} onSkip={onSkip} canGoBack={canGoBack} />

        <div className="text-xs text-muted-foreground mt-4">
          <span className="opacity-60">Next up:</span>{" "}
          {getNextPreviewText(nextStepPreview)}
        </div>
      </div>
    )
  }

  const exercise = step.exercise
  const isTimed = !!exercise.durationSeconds
  const stepName = buildStepName(step)
  const prescription = buildPrescription(exercise, !!step.side)
  const videoUrl = exercise.videos?.[0]?.url
  const hasDetails = exercise.cue || exercise.why || exercise.note
  const ctx = step.supersetContext

  return (
    <div className="flex flex-col items-center text-center px-4 py-6 space-y-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        Step {stepIndex + 1} of {totalSteps}
      </p>

      {ctx && ctx.totalRounds > 1 && (
        <div className="text-sm text-purple-400 font-medium">
          {ctx.label} · Round {ctx.round} of {ctx.totalRounds}
        </div>
      )}
      {ctx && ctx.totalRounds <= 1 && (
        <div className="text-sm text-purple-400 font-medium">{ctx.label}</div>
      )}

      <h2 className="text-2xl font-bold text-foreground">
        {ctx?.exerciseLabel && (
          <span className="text-purple-500 mr-2">{ctx.exerciseLabel}.</span>
        )}
        {stepName}
      </h2>

      {prescription && (
        <p className="text-sm text-muted-foreground">{prescription}</p>
      )}

      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Watch demo
        </a>
      )}

      {isTimed ? (
        <>
          <div className="text-7xl font-mono font-bold text-foreground tabular-nums">
            {formattedTime}
          </div>
          <div className="flex gap-3">
            {isRunning ? (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            ) : (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
            )}
          </div>
        </>
      ) : (
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold transition-colors mt-2"
        >
          <Check className="h-5 w-5" />
          Done
        </button>
      )}

      <NavRow onBack={onBack} onSkip={onSkip} canGoBack={canGoBack} />

      {hasDetails && (
        <div className="w-full max-w-sm">
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {detailsOpen ? "Hide details" : "Cue / Why"}
          </button>
          {detailsOpen && (
            <div className="mt-3 text-left space-y-2 text-xs bg-muted/30 rounded-lg p-3">
              {exercise.note && (
                <p className="text-amber-600 dark:text-amber-400 italic">{exercise.note}</p>
              )}
              {exercise.cue && (
                <p className="text-foreground">
                  <span className="font-semibold text-muted-foreground">Cue:</span> {exercise.cue}
                </p>
              )}
              {exercise.why && (
                <p className="text-muted-foreground">
                  <span className="font-semibold">Why:</span> {exercise.why}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-4">
        <span className="opacity-60">Next up:</span>{" "}
        {getNextPreviewText(nextStepPreview)}
      </div>
    </div>
  )
}
