"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  LissCoreSessionProgress,
  LissCoreStep,
  LissCoreStepResult,
} from "@/types/workout"

export type SequenceTimerCue = "five-minutes" | "one-minute" | "thirty-seconds" | "ten-seconds"

export interface SequenceTimerSnapshot {
  stepIndex: number
  remainingMs: number
  remainingSeconds: number
  isRunning: boolean
  isComplete: boolean
  activeElapsedMs: number
  stepResults: LissCoreStepResult[]
  endedEarly: boolean
}

interface SequenceTimerCallbacks {
  onBoundary?: (previousStep: LissCoreStep, nextStep: LissCoreStep, crossedStepCount: number) => void
  onCue?: (cue: SequenceTimerCue, step: LissCoreStep) => void
  onComplete?: (endedEarly: boolean) => void
}

interface EngineState {
  stepIndex: number
  remainingMs: number
  isRunning: boolean
  isComplete: boolean
  endAtMs: number | null
  lastTickAtMs: number | null
  activeElapsedMs: number
  stepResults: LissCoreStepResult[]
  endedEarly: boolean
  firedCues: Set<SequenceTimerCue>
}

const EMPTY_SNAPSHOT: SequenceTimerSnapshot = {
  stepIndex: 0,
  remainingMs: 0,
  remainingSeconds: 0,
  isRunning: false,
  isComplete: false,
  activeElapsedMs: 0,
  stepResults: [],
  endedEarly: false,
}

function cueThresholdMs(cue: SequenceTimerCue): number {
  switch (cue) {
    case "five-minutes": return 5 * 60 * 1000
    case "one-minute": return 60 * 1000
    case "thirty-seconds": return 30 * 1000
    case "ten-seconds": return 10 * 1000
  }
}

function relevantCues(step: LissCoreStep): SequenceTimerCue[] {
  if (step.exerciseId === "cardio") {
    return ["five-minutes", "one-minute", "thirty-seconds", "ten-seconds"]
  }
  if (step.kind === "work") {
    return ["thirty-seconds", "ten-seconds"]
  }
  return ["ten-seconds"]
}

function alreadyPassedCues(step: LissCoreStep, remainingMs: number): Set<SequenceTimerCue> {
  return new Set(relevantCues(step).filter((cue) => remainingMs <= cueThresholdMs(cue)))
}

function replaceStepResult(
  results: LissCoreStepResult[],
  result: LissCoreStepResult
): LissCoreStepResult[] {
  return [...results.filter((existing) => existing.stepId !== result.stepId), result]
    .sort((a, b) => a.stepIndex - b.stepIndex)
}

function createEngine(steps: LissCoreStep[]): EngineState {
  const firstDurationMs = (steps[0]?.durationSeconds ?? 0) * 1000
  return {
    stepIndex: 0,
    remainingMs: firstDurationMs,
    isRunning: false,
    isComplete: false,
    endAtMs: null,
    lastTickAtMs: null,
    activeElapsedMs: 0,
    stepResults: [],
    endedEarly: false,
    firedCues: new Set(),
  }
}

function toSnapshot(engine: EngineState): SequenceTimerSnapshot {
  return {
    stepIndex: engine.stepIndex,
    remainingMs: engine.remainingMs,
    remainingSeconds: Math.max(0, Math.ceil(engine.remainingMs / 1000)),
    isRunning: engine.isRunning,
    isComplete: engine.isComplete,
    activeElapsedMs: engine.activeElapsedMs,
    stepResults: engine.stepResults,
    endedEarly: engine.endedEarly,
  }
}

export function useSequenceTimer(steps: LissCoreStep[], callbacks: SequenceTimerCallbacks = {}) {
  const [initialEngine] = useState(() => createEngine(steps))
  const engineRef = useRef<EngineState>(initialEngine)
  const callbacksRef = useRef(callbacks)
  const stepsRef = useRef(steps)
  const [snapshot, setSnapshot] = useState<SequenceTimerSnapshot>(() => (
    steps.length > 0 ? toSnapshot(initialEngine) : EMPTY_SNAPSHOT
  ))

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    stepsRef.current = steps
  }, [steps])

  const publish = useCallback(() => {
    setSnapshot(toSnapshot(engineRef.current))
  }, [])

  const completeEngine = useCallback((endedEarly: boolean) => {
    const engine = engineRef.current
    if (engine.isComplete) return
    engine.isRunning = false
    engine.isComplete = true
    engine.endAtMs = null
    engine.lastTickAtMs = null
    engine.remainingMs = 0
    engine.endedEarly = endedEarly
    callbacksRef.current.onComplete?.(endedEarly)
  }, [])

  const reconcile = useCallback((nowMs = Date.now(), announce = true) => {
    const engine = engineRef.current
    const activeSteps = stepsRef.current
    if (!engine.isRunning || engine.isComplete || engine.endAtMs === null) return

    const finalEndAtMs = activeSteps
      .slice(engine.stepIndex + 1)
      .reduce((endAt, step) => endAt + step.durationSeconds * 1000, engine.endAtMs)
    const activityEndMs = Math.min(nowMs, finalEndAtMs)
    if (engine.lastTickAtMs !== null) {
      engine.activeElapsedMs += Math.max(0, activityEndMs - engine.lastTickAtMs)
    }
    engine.lastTickAtMs = nowMs

    const previousRemainingMs = engine.remainingMs
    engine.remainingMs = Math.max(0, engine.endAtMs - nowMs)

    if (engine.remainingMs > 0) {
      const step = activeSteps[engine.stepIndex]
      if (announce && step) {
        relevantCues(step).forEach((cue) => {
          const threshold = cueThresholdMs(cue)
          if (
            previousRemainingMs > threshold &&
            engine.remainingMs <= threshold &&
            !engine.firedCues.has(cue)
          ) {
            engine.firedCues.add(cue)
            callbacksRef.current.onCue?.(cue, step)
          }
        })
      }
      publish()
      return
    }

    let crossedStepCount = 0
    let boundaryMs = engine.endAtMs
    let previousStep = activeSteps[engine.stepIndex]

    while (previousStep && boundaryMs <= nowMs) {
      engine.stepResults = replaceStepResult(engine.stepResults, {
        stepId: previousStep.id,
        stepIndex: engine.stepIndex,
        status: "completed",
        elapsedSeconds: previousStep.durationSeconds,
      })
      crossedStepCount += 1

      const nextIndex = engine.stepIndex + 1
      if (nextIndex >= activeSteps.length) {
        completeEngine(false)
        publish()
        return
      }

      engine.stepIndex = nextIndex
      const nextStep = activeSteps[nextIndex]
      boundaryMs += nextStep.durationSeconds * 1000
      engine.endAtMs = boundaryMs
      engine.remainingMs = Math.max(0, boundaryMs - nowMs)
      engine.firedCues = alreadyPassedCues(nextStep, engine.remainingMs)

      if (boundaryMs > nowMs) {
        if (announce) {
          callbacksRef.current.onBoundary?.(previousStep, nextStep, crossedStepCount)
        }
        publish()
        return
      }

      previousStep = nextStep
    }

    publish()
  }, [completeEngine, publish])

  useEffect(() => {
    if (!snapshot.isRunning) return

    const interval = window.setInterval(() => reconcile(Date.now(), document.visibilityState === "visible"), 250)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") reconcile(Date.now(), true)
    }
    const handlePageShow = () => reconcile(Date.now(), true)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pageshow", handlePageShow)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [snapshot.isRunning, reconcile])

  const start = useCallback(() => {
    const activeSteps = stepsRef.current
    if (activeSteps.length === 0) return
    const nowMs = Date.now()
    engineRef.current = createEngine(activeSteps)
    engineRef.current.isRunning = true
    engineRef.current.endAtMs = nowMs + engineRef.current.remainingMs
    engineRef.current.lastTickAtMs = nowMs
    publish()
  }, [publish])

  const pause = useCallback(() => {
    reconcile(Date.now(), false)
    const engine = engineRef.current
    if (engine.isComplete) return
    engine.isRunning = false
    engine.endAtMs = null
    engine.lastTickAtMs = null
    publish()
  }, [publish, reconcile])

  const resume = useCallback(() => {
    const engine = engineRef.current
    if (engine.isComplete || engine.isRunning) return
    const nowMs = Date.now()
    engine.isRunning = true
    engine.endAtMs = nowMs + engine.remainingMs
    engine.lastTickAtMs = nowMs
    publish()
  }, [publish])

  const moveToStep = useCallback((nextIndex: number, keepRunning: boolean) => {
    const engine = engineRef.current
    const activeSteps = stepsRef.current
    const nextStep = activeSteps[nextIndex]
    if (!nextStep) {
      completeEngine(false)
      publish()
      return
    }

    const nowMs = Date.now()
    engine.stepIndex = nextIndex
    engine.remainingMs = nextStep.durationSeconds * 1000
    engine.isRunning = keepRunning
    engine.endAtMs = keepRunning ? nowMs + engine.remainingMs : null
    engine.lastTickAtMs = keepRunning ? nowMs : null
    engine.firedCues = new Set()
    publish()
  }, [completeEngine, publish])

  const skip = useCallback(() => {
    reconcile(Date.now(), false)
    const engine = engineRef.current
    if (engine.isComplete) return
    const currentStep = stepsRef.current[engine.stepIndex]
    if (!currentStep) return

    engine.stepResults = replaceStepResult(engine.stepResults, {
      stepId: currentStep.id,
      stepIndex: engine.stepIndex,
      status: "skipped",
      elapsedSeconds: Math.max(0, currentStep.durationSeconds - engine.remainingMs / 1000),
    })
    const nextIndex = engine.stepIndex + 1
    if (nextIndex >= stepsRef.current.length) {
      completeEngine(false)
      publish()
      return
    }
    const nextStep = stepsRef.current[nextIndex]
    if (engine.isRunning) callbacksRef.current.onBoundary?.(currentStep, nextStep, 1)
    moveToStep(nextIndex, engine.isRunning)
  }, [completeEngine, moveToStep, publish, reconcile])

  const goBack = useCallback(() => {
    reconcile(Date.now(), false)
    const engine = engineRef.current
    if (engine.isComplete) return
    const targetIndex = Math.max(0, engine.stepIndex - 1)
    engine.stepResults = engine.stepResults.filter((result) => result.stepIndex < targetIndex)
    moveToStep(targetIndex, engine.isRunning)
  }, [moveToStep, reconcile])

  const restart = useCallback(() => {
    reconcile(Date.now(), false)
    const engine = engineRef.current
    if (engine.isComplete) return
    engine.stepResults = engine.stepResults.filter((result) => result.stepIndex !== engine.stepIndex)
    moveToStep(engine.stepIndex, engine.isRunning)
  }, [moveToStep, reconcile])

  const finishEarly = useCallback(() => {
    reconcile(Date.now(), false)
    const engine = engineRef.current
    if (engine.isComplete) return

    stepsRef.current.forEach((step, index) => {
      if (index < engine.stepIndex) return
      const elapsedSeconds = index === engine.stepIndex
        ? Math.max(0, step.durationSeconds - engine.remainingMs / 1000)
        : 0
      engine.stepResults = replaceStepResult(engine.stepResults, {
        stepId: step.id,
        stepIndex: index,
        status: "skipped",
        elapsedSeconds,
      })
    })
    completeEngine(true)
    publish()
  }, [completeEngine, publish, reconcile])

  const restore = useCallback((progress: LissCoreSessionProgress, detectedAtMs: number) => {
    const activeSteps = stepsRef.current
    const safeIndex = Math.min(Math.max(0, progress.stepIndex), Math.max(0, activeSteps.length - 1))
    const currentStep = activeSteps[safeIndex]
    const remainingMs = Math.min(
      Math.max(0, progress.remainingMs),
      (currentStep?.durationSeconds ?? 0) * 1000
    )
    const wasRunning = progress.phase === "active" && progress.isRunning

    engineRef.current = {
      stepIndex: safeIndex,
      remainingMs,
      isRunning: wasRunning,
      isComplete: progress.phase === "complete",
      endAtMs: wasRunning ? progress.stepEndAtMs : null,
      lastTickAtMs: wasRunning
        ? progress.lastTickAtMs ?? Date.parse(progress.savedAt)
        : null,
      activeElapsedMs: Math.max(0, progress.activeElapsedMs),
      stepResults: progress.stepResults ?? [],
      endedEarly: progress.endedEarly ?? false,
      firedCues: currentStep ? alreadyPassedCues(currentStep, remainingMs) : new Set(),
    }

    if (wasRunning && engineRef.current.endAtMs !== null) {
      reconcile(detectedAtMs, false)
    }

    const completedWhileAway = engineRef.current.isComplete
    if (!completedWhileAway) {
      const engine = engineRef.current
      engine.isRunning = false
      engine.endAtMs = null
      engine.lastTickAtMs = null
    }
    publish()
    return { wasRunning, completedWhileAway }
  }, [publish, reconcile])

  const capture = useCallback((nowMs = Date.now()) => {
    reconcile(nowMs, false)
    return {
      ...toSnapshot(engineRef.current),
      stepEndAtMs: engineRef.current.endAtMs,
      lastTickAtMs: engineRef.current.lastTickAtMs,
    }
  }, [reconcile])

  const reset = useCallback(() => {
    engineRef.current = createEngine(stepsRef.current)
    publish()
  }, [publish])

  return {
    ...snapshot,
    start,
    pause,
    resume,
    skip,
    goBack,
    restart,
    finishEarly,
    restore,
    capture,
    reset,
  }
}
