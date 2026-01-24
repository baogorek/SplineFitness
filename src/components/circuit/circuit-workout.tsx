"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Activity, ArrowLeft, Volume2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  WorkoutVariant,
  CircuitRoundData,
  ComboCompletionResult,
  CircuitWorkoutSession,
  CircuitSessionProgress,
  ExerciseSetting,
  ExerciseVariation,
  WeakLinkEntry,
  WeakLinkPractice,
  ExercisePreference,
} from "@/types/workout"
import { circuitWorkouts } from "@/data/circuit-workouts"
import { useTimer } from "@/hooks/use-timer"
import { useAudio } from "@/hooks/use-audio"
import {
  saveWorkoutSession,
  getExercisePreferences,
  saveBulkExercisePreferences,
  saveCircuitProgress,
  getCircuitProgress,
  clearCircuitProgress,
} from "@/lib/storage"
import { ComboCard } from "./combo-card"
import { ComboTimer } from "./combo-timer"
import { RoundTimer } from "./round-timer"
import { RoundSummary } from "./round-summary"
import { useAuth } from "@/components/auth-provider"
import { CircuitSetup } from "./circuit-setup"
import { ComboCompletionModal } from "./combo-completion-modal"
import { WeakLinkPracticeModal } from "./weak-link-practice-modal"
import { WeakLinkTimer } from "./weak-link-timer"

const TRANSITION_SECONDS = 5

type Phase =
  | "setup"
  | "resume-prompt"
  | "ready"
  | "transition"
  | "timing"
  | "input"
  | "round-complete"
  | "weak-link-select"
  | "weak-link-practice"
  | "workout-complete"

interface CircuitWorkoutProps {
  onModeChange: () => void
}

export function CircuitWorkout({ onModeChange }: CircuitWorkoutProps) {
  const [phase, setPhase] = useState<Phase>("setup")
  const [activeWorkout, setActiveWorkout] = useState<WorkoutVariant>("A")
  const [currentRound, setCurrentRound] = useState(1)
  const [currentComboIndex, setCurrentComboIndex] = useState(0)
  const [rounds, setRounds] = useState<CircuitRoundData[]>([])
  const [currentRoundResults, setCurrentRoundResults] = useState<ComboCompletionResult[]>([])
  const [exerciseSettings, setExerciseSettings] = useState<Record<string, ExerciseSetting>>({})
  const [savedPreferences, setSavedPreferences] = useState<Record<string, ExercisePreference>>({})
  const [weakLinks, setWeakLinks] = useState<WeakLinkEntry[]>([])
  const [weakLinkPracticeExercises, setWeakLinkPracticeExercises] = useState<WeakLinkEntry[]>([])
  const [weakLinkPracticeDuration, setWeakLinkPracticeDuration] = useState(60)
  const [weakLinkPracticeRecords, setWeakLinkPracticeRecords] = useState<WeakLinkPractice[]>([])
  const [testMode, setTestMode] = useState(false)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const [transitionExerciseName, setTransitionExerciseName] = useState("")
  const savingRef = useRef(false)
  const workoutStartRef = useRef<string | null>(null)
  const isFirstComboRef = useRef(true)
  const resumeAfterTransitionRef = useRef(false)

  const { signInWithGoogle } = useAuth()

  const workout = circuitWorkouts[activeWorkout]
  const currentCombo = workout.combos[currentComboIndex]
  const speedMultiplier = testMode ? 12 : 1

  const audio = useAudio()

  const [pendingResume, setPendingResume] = useState<CircuitSessionProgress | null>(null)

  useEffect(() => {
    getExercisePreferences().then(setSavedPreferences)
    const saved = getCircuitProgress()
    if (saved) {
      setPendingResume(saved)
      setPhase("resume-prompt")
    }
  }, [])

  const currentComboDuration = useMemo(() => {
    if (!currentCombo) return 180
    return currentCombo.subExercises.reduce((sum, sub) => {
      return sum + (exerciseSettings[sub.id]?.durationSeconds || 60)
    }, 0)
  }, [currentCombo, exerciseSettings])

  const exerciseEndTimes = useMemo(() => {
    if (!currentCombo) return []
    const endTimes: number[] = []
    let remaining = currentComboDuration
    for (const sub of currentCombo.subExercises) {
      const duration = exerciseSettings[sub.id]?.durationSeconds || 60
      remaining -= duration
      endTimes.push(remaining)
    }
    return endTimes
  }, [currentCombo, currentComboDuration, exerciseSettings])

  const lastAnnouncedExerciseRef = useRef<number>(-1)
  const lastAnnouncedCueRef = useRef<string>("")

  const comboTimer = useTimer({
    targetSeconds: currentComboDuration,
    onTick: (remainingSeconds) => {
      if (!currentCombo) return

      let currentExerciseIndex = 0
      for (let i = 0; i < exerciseEndTimes.length; i++) {
        if (remainingSeconds > exerciseEndTimes[i]) {
          currentExerciseIndex = i
          break
        }
        currentExerciseIndex = i
      }

      const currentExercise = currentCombo.subExercises[currentExerciseIndex]
      const exerciseDuration = exerciseSettings[currentExercise?.id]?.durationSeconds || 60
      const exerciseEndTime = exerciseEndTimes[currentExerciseIndex]
      const secondsLeftInExercise = remainingSeconds - exerciseEndTime

      // Detect exercise transition: pause combo timer, show transition countdown
      if (lastAnnouncedExerciseRef.current !== currentExerciseIndex && lastAnnouncedExerciseRef.current !== -1) {
        lastAnnouncedExerciseRef.current = currentExerciseIndex
        lastAnnouncedCueRef.current = ""
        comboTimer.pause()
        resumeAfterTransitionRef.current = true
        if (currentExercise) {
          setTransitionExerciseName(currentExercise.name)
          audio.playMinuteBeep()
          audio.speak(currentExercise.name)
        }
        transitionTimer.reset()
        transitionTimer.start()
        setPhase("transition")
        return
      }

      // Mark first exercise as announced (no transition needed for it)
      if (lastAnnouncedExerciseRef.current === -1) {
        lastAnnouncedExerciseRef.current = currentExerciseIndex
      }

      // 30s / 15s warnings and 5-4-3-2-1 countdown
      const cueKey = `${currentExerciseIndex}-${secondsLeftInExercise}`
      if (exerciseDuration >= 60 && secondsLeftInExercise === 30 && lastAnnouncedCueRef.current !== cueKey) {
        lastAnnouncedCueRef.current = cueKey
        audio.speak("30 seconds")
      } else if (exerciseDuration >= 45 && secondsLeftInExercise === 15 && lastAnnouncedCueRef.current !== cueKey) {
        lastAnnouncedCueRef.current = cueKey
        audio.speak("15 seconds")
      } else if (secondsLeftInExercise >= 1 && secondsLeftInExercise <= 5 && lastAnnouncedCueRef.current !== cueKey) {
        lastAnnouncedCueRef.current = cueKey
        const countdownWords = ["one", "two", "three", "four", "five"]
        audio.speak(countdownWords[secondsLeftInExercise - 1])
      }
    },
    onComplete: () => {
      audio.playCompleteSound()
      lastAnnouncedExerciseRef.current = -1
      lastAnnouncedCueRef.current = ""
      setPhase("input")
    },
    speedMultiplier,
  })

  const transitionTimer = useTimer({
    targetSeconds: TRANSITION_SECONDS,
    onTick: (remainingSeconds) => {
      if (remainingSeconds >= 1 && remainingSeconds <= 3) {
        const cueKey = `transition-${remainingSeconds}`
        if (lastAnnouncedCueRef.current !== cueKey) {
          if (!window.speechSynthesis.speaking) {
            lastAnnouncedCueRef.current = cueKey
            const countdownWords = ["one", "two", "three"]
            audio.speak(countdownWords[remainingSeconds - 1])
          }
        }
      }
    },
    onComplete: () => {
      lastAnnouncedCueRef.current = ""
      setPhase("timing")
      if (resumeAfterTransitionRef.current) {
        comboTimer.start()
      } else {
        isFirstComboRef.current = false
        comboTimer.start()
        if (!roundTimer.isRunning) {
          roundTimer.start()
        }
      }
    },
    speedMultiplier,
  })

  const roundTimer = useTimer({ countUp: true, speedMultiplier })

  const handleTestAudio = () => {
    audio.playMinuteBeep()
    audio.speak("Alt. Single Leg Box Squats")
  }

  useEffect(() => {
    if (phase === "setup" || phase === "resume-prompt" || phase === "workout-complete") return
    saveCircuitProgress({
      variant: activeWorkout,
      exerciseSettings,
      currentRound,
      currentComboIndex,
      rounds,
      currentRoundResults,
      weakLinks,
      startedAt: workoutStartRef.current || new Date().toISOString(),
      savedAt: new Date().toISOString(),
    })
  }, [phase, activeWorkout, exerciseSettings, currentRound, currentComboIndex, rounds, currentRoundResults, weakLinks])

  const handleResume = useCallback(() => {
    if (!pendingResume) return
    setActiveWorkout(pendingResume.variant)
    setExerciseSettings(pendingResume.exerciseSettings)
    setCurrentRound(pendingResume.currentRound)
    setCurrentComboIndex(pendingResume.currentComboIndex)
    setRounds(pendingResume.rounds)
    setCurrentRoundResults(pendingResume.currentRoundResults)
    setWeakLinks(pendingResume.weakLinks)
    workoutStartRef.current = pendingResume.startedAt
    setPendingResume(null)
    setPhase("ready")
  }, [pendingResume])

  const handleDiscardResume = useCallback(() => {
    clearCircuitProgress()
    setPendingResume(null)
    setPhase("setup")
  }, [])

  const handleSetupComplete = useCallback(
    (variant: WorkoutVariant, settings: Record<string, ExerciseSetting>) => {
      setActiveWorkout(variant)
      setExerciseSettings(settings)
      workoutStartRef.current = new Date().toISOString()
      setPhase("ready")
    },
    []
  )

  const handleStartCombo = useCallback(() => {
    lastAnnouncedExerciseRef.current = -1
    lastAnnouncedCueRef.current = ""
    resumeAfterTransitionRef.current = false
    const firstExercise = currentCombo?.subExercises[0]
    if (firstExercise) {
      setTransitionExerciseName(firstExercise.name)
      audio.playMinuteBeep()
      audio.speak(firstExercise.name)
    }
    transitionTimer.reset()
    transitionTimer.start()
    setPhase("transition")
  }, [transitionTimer, currentCombo, audio])

  const handleSaveComboResult = useCallback(
    (result: ComboCompletionResult, savePreferences: boolean) => {
      const updatedResults = [...currentRoundResults, result]
      setCurrentRoundResults(updatedResults)

      if (!result.completedWithoutStopping && result.weakLinkExerciseId) {
        const exercise = currentCombo.subExercises.find(
          (s) => s.id === result.weakLinkExerciseId
        )
        if (exercise) {
          setWeakLinks((prev) => [
            ...prev,
            {
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              comboId: currentCombo.id,
              round: currentRound,
            },
          ])
        }
      }

      if (savePreferences) {
        const variationSettings: Record<string, ExerciseSetting> = {}
        Object.entries(result.exerciseVariations).forEach(([exerciseId, variation]) => {
          variationSettings[exerciseId] = {
            durationSeconds: exerciseSettings[exerciseId]?.durationSeconds || 60,
            variation,
          }
        })
        saveBulkExercisePreferences(variationSettings)
      }

      comboTimer.reset()

      if (currentComboIndex < workout.combos.length - 1) {
        setCurrentComboIndex((prev) => prev + 1)
        setPhase("ready")
      } else {
        roundTimer.pause()
        const roundData: CircuitRoundData = {
          round: currentRound,
          totalTimeSeconds: roundTimer.elapsedSeconds,
          comboResults: updatedResults,
          completedAt: new Date().toISOString(),
        }
        setRounds((prev) => [...prev, roundData])
        setPhase("round-complete")
      }
    },
    [
      currentCombo,
      currentComboIndex,
      currentRound,
      currentRoundResults,
      workout.combos.length,
      comboTimer,
      roundTimer,
      exerciseSettings,
    ]
  )

  const handleStartNextRound = useCallback(() => {
    setCurrentRound((prev) => prev + 1)
    setCurrentComboIndex(0)
    setCurrentRoundResults([])
    roundTimer.reset()
    setPhase("ready")
  }, [roundTimer])

  const handleFinishRound = useCallback(() => {
    if (weakLinks.length > 0) {
      setPhase("weak-link-select")
    } else {
      handleFinishWorkout()
    }
  }, [weakLinks.length])

  const handleStartWeakLinkPractice = useCallback(
    (exercises: WeakLinkEntry[], duration: number) => {
      setWeakLinkPracticeExercises(exercises)
      setWeakLinkPracticeDuration(duration)
      setPhase("weak-link-practice")
    },
    []
  )

  const handleWeakLinkPracticeComplete = useCallback(
    (records: WeakLinkPractice[]) => {
      setWeakLinkPracticeRecords(records)
      handleFinishWorkout(records)
    },
    []
  )

  const handleSkipWeakLinkPractice = useCallback(() => {
    handleFinishWorkout()
  }, [])

  const handleFinishWorkout = useCallback(
    async (practiceRecords?: WeakLinkPractice[]) => {
      if (savingRef.current) return
      savingRef.current = true

      const session: CircuitWorkoutSession = {
        mode: "circuit",
        workoutId: workout.id,
        variant: activeWorkout,
        startedAt: workoutStartRef.current || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        rounds: rounds,
        exerciseSettings,
        weakLinkPractice: practiceRecords || weakLinkPracticeRecords,
      }
      clearCircuitProgress()
      const result = await saveWorkoutSession(session)
      setSavedToHistory(result !== null)
      setPhase("workout-complete")
    },
    [workout.id, activeWorkout, rounds, exerciseSettings, weakLinkPracticeRecords]
  )

  const completedCombos = currentRoundResults.length
  const totalCombos = workout.combos.length
  const progressPercent = totalCombos > 0 ? (completedCombos / totalCombos) * 100 : 0

  const defaultVariations = useMemo(() => {
    const variations: Record<string, ExerciseVariation> = {}
    Object.entries(savedPreferences).forEach(([id, pref]) => {
      variations[id] = pref.defaultVariation
    })
    Object.entries(exerciseSettings).forEach(([id, setting]) => {
      if (setting.variation) {
        variations[id] = setting.variation
      }
    })
    return variations
  }, [savedPreferences, exerciseSettings])

  if (phase === "setup") {
    const initialSettings: Record<string, ExerciseSetting> = {}
    Object.entries(savedPreferences).forEach(([id, pref]) => {
      initialSettings[id] = {
        durationSeconds: pref.durationSeconds,
        variation: pref.defaultVariation,
      }
    })

    return (
      <CircuitSetup
        onBack={onModeChange}
        onStart={handleSetupComplete}
        savedSettings={initialSettings}
      />
    )
  }

  if (phase === "resume-prompt" && pendingResume) {
    const completedCombosInRound = pendingResume.currentRoundResults.length
    const completedRounds = pendingResume.rounds.length
    const savedTime = new Date(pendingResume.savedAt)
    const timeAgo = Math.round((Date.now() - savedTime.getTime()) / 60000)
    const timeAgoText = timeAgo < 1 ? "just now" : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-amber-600 flex items-center justify-center mx-auto">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Resume Workout?</h1>
          <p className="text-muted-foreground">
            You have an in-progress Workout {pendingResume.variant} session from {timeAgoText}.
          </p>
          <div className="rounded-lg bg-muted/50 p-4 text-left space-y-1">
            <p className="text-sm text-foreground">
              Round {pendingResume.currentRound} — {completedCombosInRound}/6 combos done
            </p>
            {completedRounds > 0 && (
              <p className="text-sm text-muted-foreground">
                {completedRounds} round{completedRounds !== 1 ? "s" : ""} completed
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleResume}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors w-full"
            >
              Resume
            </button>
            <button
              onClick={handleDiscardResume}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors w-full"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "weak-link-practice") {
    return (
      <WeakLinkTimer
        exercises={weakLinkPracticeExercises}
        durationSeconds={weakLinkPracticeDuration}
        onComplete={handleWeakLinkPracticeComplete}
      />
    )
  }

  if (phase === "workout-complete") {
    const totalTime = rounds.reduce((acc, r) => acc + r.totalTimeSeconds, 0)
    const completionRate = Math.round(
      (rounds.flatMap((r) => r.comboResults).filter((r) => r.completedWithoutStopping).length /
        rounds.flatMap((r) => r.comboResults).length) *
        100
    )

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center mx-auto">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
          <p className="text-muted-foreground">
            You completed {rounds.length} round{rounds.length !== 1 ? "s" : ""} of{" "}
            {workout.name}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Time
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, "0")}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Completion
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>

          {weakLinks.length > 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-left">
              <p className="text-sm font-medium text-amber-500 mb-2">Weak Links Identified</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {[...new Set(weakLinks.map((w) => w.exerciseName))].map((name) => (
                  <li key={name}>• {name}</li>
                ))}
              </ul>
            </div>
          )}

          {weakLinkPracticeRecords.length > 0 && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-left">
              <p className="text-sm font-medium text-green-500 mb-2">Weak Link Practice</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {weakLinkPracticeRecords.map((r, i) => (
                  <li key={i}>
                    • {r.exerciseName} ({r.practiceTimeSeconds}s)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {savedToHistory ? (
            <div className="rounded-lg bg-green-600/10 border border-green-600/20 p-3 mt-4">
              <p className="text-sm text-green-600 font-medium">Saved to workout history</p>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-600/10 border border-amber-600/20 p-4 mt-4">
              <p className="text-sm text-amber-600 font-medium">
                Sign in to save your workouts and track progress over time
              </p>
              <Button variant="outline" size="sm" onClick={signInWithGoogle} className="mt-3">
                Sign in with Google
              </Button>
            </div>
          )}

          <button
            onClick={onModeChange}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-4">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onModeChange} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="text-sm font-semibold tracking-tight text-foreground">CIRCUIT</span>
              <button
                onClick={() => setTestMode(!testMode)}
                className={`flex h-6 px-2 items-center gap-1 rounded text-xs font-medium transition-colors ${
                  testMode
                    ? "bg-yellow-500 text-yellow-950"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="h-3 w-3" />
                {testMode ? "12x" : "Test"}
              </button>
              <button
                onClick={handleTestAudio}
                className="flex h-6 px-2 items-center gap-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Volume2 className="h-3 w-3" />
                Audio
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Round {currentRound}
              </p>
              <p className="text-sm font-mono font-semibold text-foreground">
                {completedCombos}/{totalCombos} combos
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex rounded-lg bg-muted p-1">
              <div
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeWorkout === "A"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Workout {activeWorkout}
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                    strokeDasharray={`${progressPercent * 0.88} 88`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-background">
          <RoundTimer
            formattedTime={roundTimer.formattedTime}
            isRunning={roundTimer.isRunning}
            round={currentRound}
          />

          {phase === "transition" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Get Ready</p>
              <span className="text-6xl font-mono font-bold text-foreground tabular-nums">
                {transitionTimer.formattedTime}
              </span>
              <p className="text-lg font-semibold text-primary">
                {transitionExerciseName}
              </p>
            </div>
          )}

          {(phase === "timing" || phase === "ready") && (
            <ComboTimer
              formattedTime={comboTimer.formattedTime}
              isRunning={comboTimer.isRunning}
              elapsedSeconds={comboTimer.elapsedSeconds}
              targetSeconds={currentComboDuration}
              onStart={phase === "ready" ? handleStartCombo : comboTimer.start}
              onPause={comboTimer.pause}
              onReset={comboTimer.reset}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3">
            {workout.combos
              .filter((_, index) => index >= currentComboIndex)
              .map((combo, filteredIndex) => {
                const originalIndex = currentComboIndex + filteredIndex
                const isActive = originalIndex === currentComboIndex

                return (
                  <ComboCard
                    key={combo.id}
                    combo={combo}
                    index={originalIndex}
                    isActive={isActive && (phase === "ready" || phase === "timing" || phase === "transition")}
                    isCompleted={false}
                    exerciseSettings={exerciseSettings}
                  />
                )
              })}
          </div>
        </div>
      </div>

      {phase === "input" && (
        <ComboCompletionModal
          combo={currentCombo}
          defaultVariations={defaultVariations}
          onSave={handleSaveComboResult}
        />
      )}

      {phase === "round-complete" && rounds.length > 0 && (
        <RoundSummary
          roundData={rounds[rounds.length - 1]}
          allRounds={rounds}
          onStartNextRound={handleStartNextRound}
          onFinishWorkout={handleFinishRound}
        />
      )}

      {phase === "weak-link-select" && (
        <WeakLinkPracticeModal
          weakLinks={weakLinks}
          onStartPractice={handleStartWeakLinkPractice}
          onSkip={handleSkipWeakLinkPractice}
        />
      )}
    </div>
  )
}
