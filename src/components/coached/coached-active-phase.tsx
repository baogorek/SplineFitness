"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Play } from "lucide-react"
import { CoachedPhase } from "@/types/workout"
import { flattenPhase, CoachedStep } from "@/lib/flatten-phase"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import { scheduleCountdownTicks } from "@/lib/countdown-utils"
import { CoachedStepView } from "./coached-step-view"

const TRANSITION_SECONDS = 5

interface CoachedActivePhaseProps {
  phase: CoachedPhase
  onPhaseComplete: () => void
}

function getStepDuration(step: CoachedStep): number | null {
  if (step.type === "rest") return step.durationSeconds
  if (step.exercise.durationSeconds) return step.exercise.durationSeconds
  return null
}

function getStepPreview(step: CoachedStep): string {
  if (step.type === "rest") {
    return `Rest (${step.durationSeconds}s)`
  }
  const ex = step.exercise
  let name = ex.name
  if ("side" in step && step.side) name = `${name} — ${step.side}`
  if ("setNumber" in step && step.setNumber && step.totalSets) {
    name = `${name} (Set ${step.setNumber}/${step.totalSets})`
  }
  return name
}

function getTransitionLabel(step: CoachedStep & { type: "exercise" }): string {
  let name = step.exercise.name
  if (step.side) name = `${name} — ${step.side}`
  if (step.setNumber && step.totalSets) name = `${name} (Set ${step.setNumber}/${step.totalSets})`
  return name
}

export function CoachedActivePhase({ phase, onPhaseComplete }: CoachedActivePhaseProps) {
  const steps = useMemo(() => flattenPhase(phase), [phase])
  const [stepIndex, setStepIndex] = useState(0)
  const [stepPhase, setStepPhase] = useState<"transition" | "active">("active")
  const currentStep = steps[stepIndex]
  const stepIndexRef = useRef(stepIndex)
  stepIndexRef.current = stepIndex

  const duration = currentStep ? getStepDuration(currentStep) : null
  const isTimed = duration !== null

  const { playCountdownTick, playCompleteSound, playExerciseStartChime } = useAudio()
  const countdownTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  const clearCountdownTimeouts = useCallback(() => {
    countdownTimeoutsRef.current.forEach(t => clearTimeout(t))
    countdownTimeoutsRef.current = []
  }, [])

  const advanceStep = useCallback(() => {
    playCompleteSound()
    clearCountdownTimeouts()
    const nextIndex = stepIndexRef.current + 1
    if (nextIndex >= steps.length) {
      onPhaseComplete()
    } else {
      setStepIndex(nextIndex)
    }
  }, [steps.length, onPhaseComplete, playCompleteSound, clearCountdownTimeouts])

  const exerciseOnTick = useCallback((remaining: number) => {
    if (remaining > 0 && remaining <= 5) {
      playCountdownTick()
    }
  }, [playCountdownTick])

  // Ref-based callback to break circular dep between timers
  const onTransitionCompleteRef = useRef<() => void>(() => {})

  const transitionTimer = useTimer({
    targetSeconds: TRANSITION_SECONDS,
    onComplete: () => onTransitionCompleteRef.current(),
  })

  const exerciseTimer = useTimer({
    targetSeconds: isTimed ? duration! : undefined,
    onComplete: advanceStep,
    onTick: exerciseOnTick,
  })

  // Wire up transition complete (can safely reference exerciseTimer now)
  onTransitionCompleteRef.current = () => {
    clearCountdownTimeouts()
    playExerciseStartChime()
    setStepPhase("active")
    exerciseTimer.reset()
    exerciseTimer.start()
  }

  const skipTransition = useCallback(() => {
    transitionTimer.pause()
    transitionTimer.reset()
    onTransitionCompleteRef.current()
  }, [transitionTimer])

  // Step change effect
  useEffect(() => {
    transitionTimer.pause()
    transitionTimer.reset()
    exerciseTimer.pause()
    exerciseTimer.reset()
    clearCountdownTimeouts()

    if (!currentStep) return

    const stepDuration = getStepDuration(currentStep)
    const stepIsTimed = stepDuration !== null
    const stepIsRest = currentStep.type === "rest"

    if (stepIsTimed && !stepIsRest) {
      setStepPhase("transition")
      countdownTimeoutsRef.current = scheduleCountdownTicks(playCountdownTick, TRANSITION_SECONDS, 1, 5)
      transitionTimer.start()
    } else if (stepIsRest) {
      setStepPhase("active")
      exerciseTimer.start()
    } else {
      setStepPhase("active")
    }

    return () => clearCountdownTimeouts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  useEffect(() => {
    return () => clearCountdownTimeouts()
  }, [clearCountdownTimeouts])

  if (!currentStep) return null

  const nextStep = stepIndex + 1 < steps.length ? steps[stepIndex + 1] : null
  const nextStepPreview = nextStep ? getStepPreview(nextStep) : null

  // Transition "Get Ready" UI
  if (stepPhase === "transition" && currentStep.type === "exercise") {
    const exercise = currentStep.exercise
    const hasDetails = exercise.cue || exercise.why || exercise.note

    return (
      <div>
        <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-col items-center text-center px-4 py-6 space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Step {stepIndex + 1} of {steps.length}
          </p>

          <p className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Get Ready</p>

          <h2 className="text-2xl font-bold text-foreground">
            {getTransitionLabel(currentStep)}
          </h2>

          <div className="text-7xl font-mono font-bold text-foreground tabular-nums">
            {transitionTimer.formattedTime}
          </div>

          <button
            onClick={skipTransition}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            <Play className="h-4 w-4" />
            Start Now
          </button>

          {hasDetails && (
            <div className="w-full max-w-sm text-left space-y-2 text-xs bg-muted/30 rounded-lg p-3">
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
      </div>
    )
  }

  // Active phase UI (exercise running, rest, or rep-based)
  return (
    <div>
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      <CoachedStepView
        step={currentStep}
        formattedTime={exerciseTimer.formattedTime}
        isRunning={exerciseTimer.isRunning}
        onPause={exerciseTimer.pause}
        onResume={exerciseTimer.start}
        onDone={advanceStep}
        nextStepPreview={nextStepPreview}
        stepIndex={stepIndex}
        totalSteps={steps.length}
      />
    </div>
  )
}
