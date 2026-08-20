"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ChevronLeft,
  Gauge,
  Info,
  Pause,
  Play,
  RefreshCw,
  Save,
  Settings2,
  SkipForward,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAudio } from "@/hooks/use-audio"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSequenceTimer, SequenceTimerCue } from "@/hooks/use-sequence-timer"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"
import {
  buildLissCoreSteps,
  CORE_EXERCISE_NAMES,
  DEFAULT_LISS_CORE_TEMPLATE,
  formatCableSetup,
  formatCardioSelection,
  getCableSetupForExercise,
  getNextWorkStep,
  normalizeLissCoreTemplate,
} from "@/data/liss-core"
import {
  clearLissCoreProgress,
  getLissCoreCableSetup,
  getLissCoreProgress,
  getLissCoreTemplate,
  getLissCoreVoiceCues,
  saveLissCoreCableSetup,
  saveLissCoreProgress,
  saveLissCoreTemplate,
  saveLissCoreVoiceCues,
  saveWorkoutSession,
} from "@/lib/storage"
import {
  CableExerciseSetup,
  CardioIntervalSelection,
  CoreDifficulty,
  CoreExerciseId,
  LissCoreCableSetup,
  LissCoreSessionProgress,
  LissCoreStep,
  LissCoreStepResult,
  LissCoreTemplate,
  LissCoreWorkoutSession,
} from "@/types/workout"
import { CableSetupFields, CardioModalityFields, LissCoreSetup } from "./liss-core-setup"

interface LissCoreWorkoutProps {
  onModeChange: () => void
}

interface ActiveConfig {
  template: LissCoreTemplate
  cableSetup: LissCoreCableSetup
  previousCableSetup: LissCoreCableSetup
  cardioSelections: Record<string, CardioIntervalSelection>
  voiceCues: boolean
  startedAt: string
  initialProgress?: LissCoreSessionProgress
  resumeDetectedAtMs?: number
}

interface WorkoutSummary {
  cardioSeconds: number
  abdominalSeconds: number
  extensorSeconds: number
  completedIntervals: number
  skippedIntervals: number
}

const DIFFICULTY_OPTIONS: { value: CoreDifficulty; label: string }[] = [
  { value: "too-easy", label: "Too Easy" },
  { value: "about-right", label: "About Right" },
  { value: "too-hard", label: "Too Hard" },
]

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`
}

function formatSummaryDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  const remainder = rounded % 60
  return `${minutes}:${remainder.toString().padStart(2, "0")}`
}

function getResumeLabel(progress: LissCoreSessionProgress): string {
  if (progress.phase === "complete") return "Workout complete — finish logging"
  const steps = buildLissCoreSteps(progress.template)
  const step = steps[Math.min(progress.stepIndex, steps.length - 1)]
  if (!step) return "Workout in progress"
  return step.label
}

function summarizeWorkout(steps: LissCoreStep[], results: LissCoreStepResult[]): WorkoutSummary {
  const byStepId = new Map(results.map((result) => [result.stepId, result]))
  const summary: WorkoutSummary = {
    cardioSeconds: 0,
    abdominalSeconds: 0,
    extensorSeconds: 0,
    completedIntervals: 0,
    skippedIntervals: 0,
  }

  steps.forEach((step) => {
    if (step.kind !== "work") return
    const result = byStepId.get(step.id)
    if (!result) return
    const performedSeconds = Math.min(step.durationSeconds, Math.max(0, result.elapsedSeconds))
    if (step.workCategory === "cardio") summary.cardioSeconds += performedSeconds
    if (step.workCategory === "abdominal") summary.abdominalSeconds += performedSeconds
    if (step.workCategory === "extensor") summary.extensorSeconds += performedSeconds
    if (result.status === "completed") summary.completedIntervals += 1
    if (result.status === "skipped") summary.skippedIntervals += 1
  })

  return summary
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined") navigator.vibrate?.(pattern)
}

function speechForStep(step: LissCoreStep): string {
  const pieces = [`${step.label}.`, step.substep ? `${step.substep}.` : null]
  return pieces.filter(Boolean).join(" ")
}

function CardioSetupModal({
  label,
  selection,
  onChange,
  onClose,
}: {
  label: string
  selection?: CardioIntervalSelection
  onChange: (selection: CardioIntervalSelection) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<CardioIntervalSelection>(selection ?? {})
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" aria-label="Close cardio setup" onClick={onClose} />
      <Card className="relative z-10 mb-4 w-[calc(100%-2rem)] max-w-md gap-4 py-5">
        <CardHeader className="px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Today&apos;s cardio</p>
              <h2 className="mt-1 text-xl font-bold">{label}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cardio setup"><X /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5">
          <CardioModalityFields label="Modality" selection={draft} onChange={setDraft} />
          <p className="text-xs text-muted-foreground">The workout timer continues while this is open.</p>
          <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => { onChange(draft); onClose() }}>
            Save Cardio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ExerciseInfoModal({ step, onClose }: { step: LissCoreStep; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" aria-label="Close instructions" onClick={onClose} />
      <Card className="relative z-10 mb-4 w-[calc(100%-2rem)] max-w-md gap-4 py-5">
        <CardHeader className="px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Exercise instructions</p>
              <h2 className="mt-1 text-xl font-bold">{step.label}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close instructions"><X /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          <p className="leading-relaxed text-slate-700">{step.instructions}</p>
          <p className="text-xs text-muted-foreground">The workout timer continues while this is open.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function CableSetupModal({
  label,
  setup,
  includeNote,
  onChange,
  onClose,
}: {
  label: string
  setup: CableExerciseSetup
  includeNote: boolean
  onChange: (setup: CableExerciseSetup) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(setup)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" aria-label="Close cable setup" onClick={onClose} />
      <Card className="relative z-10 mb-4 w-[calc(100%-2rem)] max-w-lg gap-4 py-5">
        <CardHeader className="px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Today&apos;s cable setup</p>
              <h2 className="mt-1 text-xl font-bold">{label}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cable setup"><X /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-5">
          <CableSetupFields label={label} setup={draft} includeNote={includeNote} onChange={setDraft} />
          <p className="text-xs text-muted-foreground">The workout timer continues while this is open.</p>
          <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={() => { onChange(draft); onClose() }}>
            Save Setup
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DifficultyRow({
  label,
  value,
  onChange,
}: {
  label: string
  value?: CoreDifficulty
  onChange: (value: CoreDifficulty) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              value === option.value
                ? "border-violet-600 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CompletedWorkout({
  config,
  steps,
  totalTimeSeconds,
  stepResults,
  endedEarly,
  cableSetup,
  cardioSelections,
  onCableSetupChange,
  onExit,
}: {
  config: ActiveConfig
  steps: LissCoreStep[]
  totalTimeSeconds: number
  stepResults: LissCoreStepResult[]
  endedEarly: boolean
  cableSetup: LissCoreCableSetup
  cardioSelections: Record<string, CardioIntervalSelection>
  onCableSetupChange: (setup: LissCoreCableSetup) => void
  onExit: () => void
}) {
  const { user, signInWithGoogle } = useAuth()
  const [ratings, setRatings] = useState<Partial<Record<CoreExerciseId | "overall", CoreDifficulty>>>({})
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedToHistory, setSavedToHistory] = useState(false)
  const summary = useMemo(() => summarizeWorkout(steps, stepResults), [steps, stepResults])

  const setupRows = useMemo(() => {
    if (cableSetup.useSideSpecificRotation) {
      return [
        ["Rotation — left", cableSetup.rotationLeft ?? cableSetup.rotation],
        ["Rotation — right", cableSetup.rotationRight ?? cableSetup.rotation],
        ["Crunch", cableSetup.crunch],
        ["Back extension", cableSetup.backExtension],
      ] as const
    }
    return [
      ["Rotation", cableSetup.rotation],
      ["Crunch", cableSetup.crunch],
      ["Back extension", cableSetup.backExtension],
    ] as const
  }, [cableSetup])

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    saveLissCoreCableSetup(cableSetup)

    const session: LissCoreWorkoutSession = {
      mode: "liss-core",
      startedAt: config.startedAt,
      completedAt: new Date().toISOString(),
      totalTimeSeconds,
      template: config.template,
      cableSetup,
      cardioSelections,
      stepResults,
      ...summary,
      ...(Object.keys(ratings).length > 0 && { difficultyRatings: ratings }),
      ...(notes.trim() && { notes: notes.trim() }),
      endedEarly,
    }

    let historySaved = false
    if (FEATURES.AUTH_ENABLED && user) {
      historySaved = (await saveWorkoutSession(session)) !== null
    }
    if (!historySaved) clearLissCoreProgress()
    setSavedToHistory(historySaved)
    setSaved(true)
    setSaving(false)
    onCableSetupChange(cableSetup)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-violet-50 to-white">
      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 py-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest text-violet-600">
            {endedEarly ? "Workout ended" : "Workout complete"}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">LISS + Core Endurance</h1>
        </div>

        <Card className="gap-4 py-5">
          <CardContent className="grid grid-cols-2 gap-3 px-5 sm:grid-cols-4">
            {[
              ["Total", totalTimeSeconds],
              ["Cardio", summary.cardioSeconds],
              ["Abdominal", summary.abdominalSeconds],
              ["Extensor", summary.extensorSeconds],
            ].map(([label, seconds]) => (
              <div key={String(label)} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 font-mono text-xl font-bold text-slate-900">{formatSummaryDuration(Number(seconds))}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-bold text-slate-900">Cardio Used</h2>
          </CardHeader>
          <CardContent className="space-y-2 px-5">
            {config.template.blocks.filter((block) => block.kind === "cardio").map((block, index) => (
              <div key={block.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <span className="font-semibold text-slate-700">Cardio {index + 1}</span>
                <span className="text-slate-500">{formatCardioSelection(cardioSelections[block.id]) ?? "Not recorded"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-bold text-slate-900">Cable Setup Used</h2>
          </CardHeader>
          <CardContent className="space-y-3 px-5">
            {setupRows.map(([label, setup]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{formatCableSetup(setup) ?? "Not recorded"}</p>
                {setup.setupNote && <p className="mt-1 text-xs text-slate-500">{setup.setupNote}</p>}
              </div>
            ))}
            <p className="text-xs text-slate-500">
              {summary.completedIntervals} work intervals completed · {summary.skippedIntervals} skipped
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-bold text-slate-900">How did it feel?</h2>
            <p className="text-sm text-slate-500">Optional—leave anything blank that you don&apos;t want to log.</p>
          </CardHeader>
          <CardContent className="space-y-5 px-5">
            {(["rotation", "crunch", "back-extension"] as CoreExerciseId[]).map((exerciseId) => (
              <DifficultyRow
                key={exerciseId}
                label={CORE_EXERCISE_NAMES[exerciseId]}
                value={ratings[exerciseId]}
                onChange={(value) => setRatings((current) => ({ ...current, [exerciseId]: value }))}
              />
            ))}
            <DifficultyRow
              label="Overall workout"
              value={ratings.overall}
              onChange={(value) => setRatings((current) => ({ ...current, overall: value }))}
            />
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional session notes"
                rows={3}
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>
          </CardContent>
        </Card>

        {!saved ? (
          <div className="space-y-3">
            <Button className="h-12 w-full bg-violet-600 text-base hover:bg-violet-700" disabled={saving} onClick={handleSave}>
              <Save /> {saving ? "Saving…" : user ? "Save Workout" : "Finish Workout"}
            </Button>
            {!user && FEATURES.AUTH_ENABLED && (
              <button className="w-full text-center text-sm text-violet-700 underline-offset-4 hover:underline" onClick={signInWithGoogle}>
                Sign in to save this session to calendar history
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm font-medium text-emerald-600">
              {savedToHistory ? "Saved to workout history." : "Workout finished. Your cable setup is saved on this device."}
            </p>
            <Button className="h-12 w-full" onClick={onExit}>Back to Home</Button>
          </div>
        )}
      </main>
    </div>
  )
}

function ActiveWorkout({
  config,
  audio,
  onExit,
}: {
  config: ActiveConfig
  audio: ReturnType<typeof useAudio>
  onExit: () => void
}) {
  const steps = useMemo(() => buildLissCoreSteps(config.template), [config.template])
  const [voiceCues, setVoiceCues] = useState(config.voiceCues)
  const [cableSetup, setCableSetup] = useState(config.cableSetup)
  const [cardioSelections, setCardioSelections] = useState(config.cardioSelections)
  const [openInfoStep, setOpenInfoStep] = useState<LissCoreStep | null>(null)
  const [editingCableStep, setEditingCableStep] = useState<LissCoreStep | null>(null)
  const [editingCardioStep, setEditingCardioStep] = useState<LissCoreStep | null>(null)
  const initializedRef = useRef(false)

  const handleBoundary = useCallback((previousStep: LissCoreStep, nextStep: LissCoreStep) => {
    const sideSwitch = previousStep.exerciseId === "rotation" &&
      previousStep.side === "left" && nextStep.exerciseId === "rotation" && nextStep.side === "right"

    if (sideSwitch) {
      audio.playSideSwitchSound()
      vibrate([140, 80, 140])
      if (voiceCues) audio.speak("Switch sides.")
      return
    }

    if (nextStep.kind === "work") {
      audio.playExerciseStartChime()
      vibrate(180)
      if (voiceCues) {
        const modality = nextStep.blockId ? formatCardioSelection(cardioSelections[nextStep.blockId]) : null
        audio.speak(`${speechForStep(nextStep)}${modality ? ` ${modality}.` : ""}`)
      }
      return
    }

    audio.playExerciseEndSound()
    vibrate([180, 90, 100])
  }, [audio, cardioSelections, voiceCues])

  const handleCue = useCallback((cue: SequenceTimerCue) => {
    audio.playWarningSound()
    vibrate(90)
    if (!voiceCues) return
    const cueText: Record<SequenceTimerCue, string> = {
      "five-minutes": "5 minutes remaining.",
      "one-minute": "1 minute remaining.",
      "thirty-seconds": "30 seconds.",
      "ten-seconds": "10 seconds.",
    }
    audio.speak(cueText[cue])
  }, [audio, voiceCues])

  const handleComplete = useCallback(() => {
    audio.playCompleteSound()
    vibrate([300, 120, 300, 120, 500])
    if (voiceCues) audio.speak("Workout complete.")
  }, [audio, voiceCues])

  const timer = useSequenceTimer(steps, {
    onBoundary: handleBoundary,
    onCue: handleCue,
    onComplete: handleComplete,
  })
  const captureTimer = timer.capture
  const restoreTimer = timer.restore
  const resumeTimer = timer.resume
  const startTimer = timer.start

  useWakeLock(!timer.isComplete)
  useNavigationGuard(!timer.isComplete)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (config.initialProgress) {
      const restored = restoreTimer(config.initialProgress, config.resumeDetectedAtMs ?? Date.now())
      if (restored.wasRunning && !restored.completedWhileAway) resumeTimer()
      const restoredSnapshot = captureTimer()
      const restoredStep = steps[restoredSnapshot.stepIndex]
      if (!restored.completedWhileAway && restoredStep) {
        audio.playExerciseStartChime()
        if (voiceCues) {
          const modality = restoredStep.blockId ? formatCardioSelection(cardioSelections[restoredStep.blockId]) : null
          audio.speak(`${speechForStep(restoredStep)}${modality ? ` ${modality}.` : ""}`)
        }
      }
    } else {
      startTimer()
    }
  }, [audio, captureTimer, cardioSelections, config.initialProgress, config.resumeDetectedAtMs, restoreTimer, resumeTimer, startTimer, steps, voiceCues])

  useEffect(() => {
    if (timer.isComplete) {
      audio.stopKeepalive()
    } else {
      audio.startKeepalive()
    }
    return () => audio.stopKeepalive()
  }, [audio, timer.isComplete])

  const saveProgressSnapshot = useCallback(() => {
    const captured = captureTimer()
    saveLissCoreProgress({
      phase: captured.isComplete ? "complete" : "active",
      template: config.template,
      cableSetup,
      previousCableSetup: config.previousCableSetup,
      cardioSelections,
      voiceCues,
      startedAt: config.startedAt,
      savedAt: new Date().toISOString(),
      stepIndex: captured.stepIndex,
      isRunning: captured.isRunning,
      stepEndAtMs: captured.stepEndAtMs,
      remainingMs: captured.remainingMs,
      activeElapsedMs: captured.activeElapsedMs,
      lastTickAtMs: captured.lastTickAtMs,
      stepResults: captured.stepResults,
      endedEarly: captured.endedEarly,
    })
  }, [cableSetup, captureTimer, cardioSelections, config.previousCableSetup, config.startedAt, config.template, voiceCues])

  useEffect(() => {
    const interval = window.setInterval(saveProgressSnapshot, 2000)
    const handlePageHide = () => saveProgressSnapshot()
    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handlePageHide)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handlePageHide)
    }
  }, [saveProgressSnapshot])

  useEffect(() => {
    if (timer.isComplete) saveProgressSnapshot()
  }, [timer.isComplete, saveProgressSnapshot])

  const currentStep = steps[timer.stepIndex] ?? steps[steps.length - 1]
  const nextWorkStep = getNextWorkStep(steps, timer.stepIndex)
  const infoStep = currentStep?.kind === "work" ? currentStep : nextWorkStep
  const previousSetup = getCableSetupForExercise(
    config.previousCableSetup,
    currentStep?.exerciseId,
    currentStep?.side
  )
  const currentCableSetup = getCableSetupForExercise(cableSetup, currentStep?.exerciseId, currentStep?.side)
  const previousSetupText = formatCableSetup(previousSetup)
  const currentSetupText = formatCableSetup(currentCableSetup)
  const currentCardioSelection = currentStep?.blockId ? cardioSelections[currentStep.blockId] : undefined
  const currentCardioText = formatCardioSelection(currentCardioSelection)
  const nextCardioText = nextWorkStep?.blockId && nextWorkStep.exerciseId === "cardio"
    ? formatCardioSelection(cardioSelections[nextWorkStep.blockId])
    : null
  const progressPercent = currentStep
    ? Math.min(100, Math.max(0, ((currentStep.durationSeconds - timer.remainingMs / 1000) / currentStep.durationSeconds) * 100))
    : 0

  const updateCableSetupForStep = (step: LissCoreStep, setup: CableExerciseSetup) => {
    if (step.exerciseId === "rotation") {
      if (cableSetup.useSideSpecificRotation && step.side === "left") {
        setCableSetup((current) => ({ ...current, rotationLeft: setup }))
      } else if (cableSetup.useSideSpecificRotation && step.side === "right") {
        setCableSetup((current) => ({ ...current, rotationRight: setup }))
      } else {
        setCableSetup((current) => ({ ...current, rotation: setup }))
      }
    } else if (step.exerciseId === "crunch") {
      setCableSetup((current) => ({ ...current, crunch: setup }))
    } else if (step.exerciseId === "back-extension") {
      setCableSetup((current) => ({ ...current, backExtension: setup }))
    }
  }

  const handleVoiceToggle = () => {
    const enabled = !voiceCues
    setVoiceCues(enabled)
    saveLissCoreVoiceCues(enabled)
  }

  if (timer.isComplete) {
    return (
      <CompletedWorkout
        config={config}
        steps={steps}
        totalTimeSeconds={timer.activeElapsedMs / 1000}
        stepResults={timer.stepResults}
        endedEarly={timer.endedEarly}
        cableSetup={cableSetup}
        cardioSelections={cardioSelections}
        onCableSetupChange={setCableSetup}
        onExit={onExit}
      />
    )
  }

  if (!currentStep) return null
  const isTransition = currentStep.kind !== "work"
  const upcomingLabel = nextWorkStep?.label ?? "Workout complete"

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-violet-300">LISS + CORE ENDURANCE</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={voiceCues ? "Turn voice cues off" : "Turn voice cues on"}
              onClick={handleVoiceToggle}
              className="text-slate-300 hover:bg-white/10 hover:text-white"
            >
              {voiceCues ? <Volume2 /> : <VolumeX />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("End this workout now? Remaining intervals will be marked skipped.")) timer.finishEarly()
              }}
              className="text-slate-400 hover:bg-white/10 hover:text-white"
            >
              End
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-61px)] w-full max-w-2xl flex-col p-4 pb-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Block {(currentStep.blockIndex ?? 0) + 1} of {currentStep.blockCount ?? config.template.blocks.length}</span>
          <span>Step {timer.stepIndex + 1} of {steps.length}</span>
        </div>

        <div className="mt-6 flex flex-1 flex-col items-center text-center">
          {isTransition ? (
            <>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                {currentStep.kind === "reset" ? "Reset" : "Get ready"}
              </p>
              <h1 className="mt-3 text-3xl font-bold">{upcomingLabel}</h1>
              {(nextWorkStep?.substep || currentStep.substep) && (
                <p className="mt-2 text-lg font-semibold text-violet-300">{nextWorkStep?.substep ?? currentStep.substep}</p>
              )}
              {nextCardioText && <p className="mt-2 text-lg font-semibold text-violet-300">{nextCardioText}</p>}
              <p className="mt-8 text-sm uppercase tracking-wider text-slate-400">Starting in</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold sm:text-4xl">{currentStep.label}</h1>
                {infoStep?.instructions && (
                  <button
                    className="rounded-full p-1 text-violet-300 hover:bg-white/10 hover:text-white"
                    aria-label={`Show ${infoStep.label} instructions`}
                    onClick={() => setOpenInfoStep(infoStep)}
                  >
                    <Info className="h-6 w-6" />
                  </button>
                )}
              </div>
              {currentStep.substep && <p className="mt-3 text-xl font-bold tracking-wider text-violet-300">{currentStep.substep}</p>}
              <p className="mt-8 text-sm uppercase tracking-wider text-slate-400">Remaining</p>
            </>
          )}

          <div className={`mt-2 font-mono text-7xl font-black tabular-nums tracking-tight sm:text-8xl ${isTransition ? "text-amber-300" : "text-white"}`}>
            {formatTimer(timer.remainingSeconds)}
          </div>

          <div className="mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full transition-[width] duration-200 ${isTransition ? "bg-amber-400" : "bg-violet-500"}`} style={{ width: `${progressPercent}%` }} />
          </div>

          {!isTransition && currentStep.exerciseId === "cardio" && (
            <div className="mt-6 flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
              <p className="text-sm text-slate-200"><span className="font-semibold">Modality:</span> {currentCardioText ?? "Not selected"}</p>
              <Button variant="ghost" size="sm" className="text-violet-300 hover:bg-white/10 hover:text-white" onClick={() => setEditingCardioStep(currentStep)}>
                <Settings2 /> Edit
              </Button>
            </div>
          )}

          {!isTransition && currentStep.exerciseId !== "cardio" && (
            <div className="mt-6 w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-left">
              {previousSetupText && <p className="text-xs text-slate-400"><span className="font-semibold text-slate-300">Last setup:</span> {previousSetupText}</p>}
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-200"><span className="font-semibold">Today:</span> {currentSetupText ?? "Not recorded"}</p>
                <Button variant="ghost" size="sm" className="text-violet-300 hover:bg-white/10 hover:text-white" onClick={() => setEditingCableStep(currentStep)}>
                  <Settings2 /> Edit
                </Button>
              </div>
              {currentCableSetup?.setupNote && <p className="mt-1 text-xs text-slate-400">{currentCableSetup.setupNote}</p>}
            </div>
          )}

          {isTransition && (
          <Button
            className="mt-8 h-12 w-full max-w-md bg-amber-400 text-base font-bold text-slate-950 hover:bg-amber-300"
            onClick={() => {
              const wasPaused = !timer.isRunning
              timer.skip()
              if (wasPaused) timer.resume()
            }}
          >
              <Play className="fill-current" /> START NOW
            </Button>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-14 bg-violet-600 text-base hover:bg-violet-500"
              onClick={timer.isRunning ? timer.pause : timer.resume}
            >
              {timer.isRunning ? <><Pause className="fill-current" /> Pause</> : <><Play className="fill-current" /> Resume</>}
            </Button>
            <Button variant="outline" className="h-14 border-white/20 bg-white/5 text-base text-white hover:bg-white/10" onClick={timer.skip}>
              <SkipForward /> Skip
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={timer.goBack}>
              <ChevronLeft /> Previous step
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={timer.restart}>
              <RefreshCw /> Restart step
            </Button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <span className="text-slate-400">Next: </span>
            <span className="font-semibold text-white">{nextWorkStep ? `${nextWorkStep.label}${nextWorkStep.substep ? ` — ${nextWorkStep.substep}` : nextCardioText ? ` — ${nextCardioText}` : ""} · ${formatTimer(nextWorkStep.durationSeconds)}` : "Workout complete"}</span>
          </div>
        </div>
      </main>

      {openInfoStep && <ExerciseInfoModal step={openInfoStep} onClose={() => setOpenInfoStep(null)} />}
      {editingCableStep && (
        <CableSetupModal
          label={`${editingCableStep.label}${editingCableStep.substep ? ` — ${editingCableStep.substep}` : ""}`}
          setup={getCableSetupForExercise(cableSetup, editingCableStep.exerciseId, editingCableStep.side) ?? {}}
          includeNote={editingCableStep.exerciseId === "back-extension"}
          onChange={(setup) => updateCableSetupForStep(editingCableStep, setup)}
          onClose={() => setEditingCableStep(null)}
        />
      )}
      {editingCardioStep && editingCardioStep.blockId && (
        <CardioSetupModal
          label={editingCardioStep.label}
          selection={cardioSelections[editingCardioStep.blockId]}
          onChange={(selection) => setCardioSelections((current) => ({ ...current, [editingCardioStep.blockId!]: selection }))}
          onClose={() => setEditingCardioStep(null)}
        />
      )}
    </div>
  )
}

export function LissCoreWorkout({ onModeChange }: LissCoreWorkoutProps) {
  const audio = useAudio()
  const [defaultTemplate, setDefaultTemplate] = useState(() => (
    normalizeLissCoreTemplate(getLissCoreTemplate() ?? DEFAULT_LISS_CORE_TEMPLATE)
  ))
  const [previousCableSetup] = useState<LissCoreCableSetup>(() => getLissCoreCableSetup())
  const [voiceCues, setVoiceCues] = useState(() => getLissCoreVoiceCues())
  const [pendingProgress, setPendingProgress] = useState<LissCoreSessionProgress | null>(() => getLissCoreProgress())
  const [resumeDetectedAtMs] = useState(() => Date.now())
  const [activeConfig, setActiveConfig] = useState<ActiveConfig | null>(null)

  const handleStart = (
    template: LissCoreTemplate,
    cableSetup: LissCoreCableSetup,
    cardioSelections: Record<string, CardioIntervalSelection>,
    enabledVoiceCues: boolean
  ) => {
    clearLissCoreProgress()
    audio.playExerciseStartChime()
    vibrate(180)
    if (enabledVoiceCues) {
      const firstCardio = template.blocks.find((block) => block.kind === "cardio")
      const modality = firstCardio ? formatCardioSelection(cardioSelections[firstCardio.id]) : null
      audio.speak(`Cardio.${modality ? ` ${modality}.` : ""}`)
    }
    setActiveConfig({
      template,
      cableSetup,
      previousCableSetup,
      cardioSelections,
      voiceCues: enabledVoiceCues,
      startedAt: new Date().toISOString(),
    })
  }

  const handleResume = () => {
    if (!pendingProgress) return
    audio.playExerciseStartChime()
    setActiveConfig({
      template: normalizeLissCoreTemplate(pendingProgress.template),
      cableSetup: pendingProgress.cableSetup,
      previousCableSetup: pendingProgress.previousCableSetup,
      cardioSelections: pendingProgress.cardioSelections,
      voiceCues: pendingProgress.voiceCues,
      startedAt: pendingProgress.startedAt,
      initialProgress: pendingProgress,
      resumeDetectedAtMs,
    })
  }

  if (activeConfig) {
    return <ActiveWorkout config={activeConfig} audio={audio} onExit={onModeChange} />
  }

  return (
    <>
      <LissCoreSetup
        initialTemplate={defaultTemplate}
        previousCableSetup={previousCableSetup}
        initialVoiceCues={voiceCues}
        onBack={onModeChange}
        onStart={handleStart}
        onSaveDefault={(template) => {
          saveLissCoreTemplate(template)
          setDefaultTemplate(template)
        }}
        onVoiceCuesChange={(enabled) => {
          setVoiceCues(enabled)
          saveLissCoreVoiceCues(enabled)
        }}
      />

      {pendingProgress && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" />
          <Card className="relative z-10 mb-4 w-[calc(100%-2rem)] max-w-md gap-4 py-5">
            <CardHeader className="px-5">
              <div className="flex items-center gap-2 text-violet-700">
                <Gauge className="h-5 w-5" />
                <p className="text-xs font-bold uppercase tracking-wider">Saved workout found</p>
              </div>
              <h2 className="text-xl font-bold">Resume LISS + Core Endurance?</h2>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">{getResumeLabel(pendingProgress)}</p>
                <p className="mt-1 text-xs text-slate-500">Saved {new Date(pendingProgress.savedAt).toLocaleString()}</p>
              </div>
              <p className="text-sm text-slate-600">Time that passed while the workout was running has already been reconstructed. Time on this prompt will not be counted.</p>
              <Button className="h-11 w-full bg-violet-600 hover:bg-violet-700" onClick={handleResume}>
                <Play /> Resume Workout
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => {
                  clearLissCoreProgress()
                  setPendingProgress(null)
                }}
              >
                <ArrowLeft /> Start Over
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
