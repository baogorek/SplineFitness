"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Clock3,
  Play,
  Save,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  CORE_EXERCISE_NAMES,
  getPlannedWorkoutSeconds,
  normalizeLissCoreTemplate,
} from "@/data/liss-core"
import {
  CoreExerciseId,
  CableExerciseSetup,
  LissCoreCableSetup,
  LissCoreTemplate,
} from "@/types/workout"

interface LissCoreSetupProps {
  initialTemplate: LissCoreTemplate
  previousCableSetup: LissCoreCableSetup
  initialVoiceCues: boolean
  onBack: () => void
  onStart: (
    template: LissCoreTemplate,
    cableSetup: LissCoreCableSetup,
    voiceCues: boolean
  ) => void
  onSaveDefault: (template: LissCoreTemplate) => void
  onVoiceCuesChange: (enabled: boolean) => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  if (remainder === 0) return `${minutes} min`
  return `${minutes}:${remainder.toString().padStart(2, "0")}`
}

export function CableSetupFields({
  label,
  setup,
  includeNote = false,
  onChange,
}: {
  label: string
  setup: CableExerciseSetup
  includeNote?: boolean
  onChange: (setup: CableExerciseSetup) => void
}) {
  return (
    <div className="space-y-3 rounded-xl border bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Resistance</span>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="2.5"
              value={setup.weight ?? ""}
              placeholder="—"
              onChange={(event) => {
                const next = event.target.value === "" ? undefined : Number(event.target.value)
                onChange({
                  ...setup,
                  weight: next !== undefined && Number.isFinite(next) ? Math.max(0, next) : undefined,
                })
              }}
              className="pr-10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lb</span>
          </div>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Pulley height / position</span>
          <Input
            value={setup.pulleyPosition ?? ""}
            placeholder="e.g. 11 or chest"
            onChange={(event) => onChange({ ...setup, pulleyPosition: event.target.value || undefined })}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Attachment</span>
          <Input
            value={setup.attachment ?? ""}
            placeholder="e.g. D-handle"
            onChange={(event) => onChange({ ...setup, attachment: event.target.value || undefined })}
          />
        </label>
      </div>
      {includeNote && (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Setup note</span>
          <Input
            value={setup.setupNote ?? ""}
            placeholder="e.g. staggered stance, two steps from stack"
            onChange={(event) => onChange({ ...setup, setupNote: event.target.value || undefined })}
          />
        </label>
      )}
    </div>
  )
}

function NumberSetting({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="relative">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(next)
          }}
          className="pr-14"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </label>
  )
}

export function LissCoreSetup({
  initialTemplate,
  previousCableSetup,
  initialVoiceCues,
  onBack,
  onStart,
  onSaveDefault,
  onVoiceCuesChange,
}: LissCoreSetupProps) {
  const [template, setTemplate] = useState<LissCoreTemplate>(() => normalizeLissCoreTemplate(initialTemplate))
  const [cableSetup, setCableSetup] = useState<LissCoreCableSetup>(() => ({
    ...previousCableSetup,
    useSideSpecificRotation: previousCableSetup.useSideSpecificRotation ?? false,
  }))
  const [voiceCues, setVoiceCues] = useState(initialVoiceCues)
  const [savedMessage, setSavedMessage] = useState(false)

  const plannedSeconds = useMemo(() => getPlannedWorkoutSeconds(template), [template])

  const updateTemplate = <K extends keyof LissCoreTemplate>(
    key: K,
    value: LissCoreTemplate[K]
  ) => {
    setTemplate((current) => ({ ...current, [key]: value }))
    setSavedMessage(false)
  }

  const updateCableSetup = (patch: Partial<LissCoreCableSetup>) => {
    setCableSetup((current) => ({ ...current, ...patch }))
  }

  const moveExercise = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= template.exerciseOrder.length) return
    const order = [...template.exerciseOrder]
    ;[order[index], order[nextIndex]] = [order[nextIndex], order[index]]
    updateTemplate("exerciseOrder", order)
  }

  const handleSideSpecificChange = (enabled: boolean) => {
    updateCableSetup({
      useSideSpecificRotation: enabled,
      ...(enabled && {
        rotationLeft: cableSetup.rotationLeft ?? { ...cableSetup.rotation },
        rotationRight: cableSetup.rotationRight ?? { ...cableSetup.rotation },
      }),
    })
  }

  const handleVoiceChange = (enabled: boolean) => {
    setVoiceCues(enabled)
    onVoiceCuesChange(enabled)
  }

  const handleSaveDefault = () => {
    const normalized = normalizeLissCoreTemplate(template)
    setTemplate(normalized)
    onSaveDefault(normalized)
    setSavedMessage(true)
  }

  const handleStart = () => {
    onStart(normalizeLissCoreTemplate(template), cableSetup, voiceCues)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-violet-50 to-white">
      <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="text-xs font-bold tracking-wider text-violet-700">LISS + CORE ENDURANCE</span>
          <div className="w-16" aria-hidden="true" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 pb-28">
        <div className="py-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Today&apos;s workout</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">LISS + Core Endurance</h1>
          <p className="mt-2 text-sm text-slate-500">
            {formatDuration(plannedSeconds)} planned · {template.rounds} core round{template.rounds === 1 ? "" : "s"}
          </p>
        </div>

        <Card className="gap-4 border-violet-200 py-5">
          <CardHeader className="px-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-violet-600" />
              <h2 className="font-bold text-slate-900">Edit Today&apos;s Workout</h2>
            </div>
            <p className="text-sm text-slate-500">These changes apply only to this session unless you save them as the default.</p>
          </CardHeader>
          <CardContent className="space-y-5 px-5">
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workout timing</h3>
              <div className="grid grid-cols-2 gap-3">
                <NumberSetting
                  label="Treadmill LISS"
                  value={template.lissDurationSeconds / 60}
                  min={1}
                  max={240}
                  suffix="min"
                  onChange={(value) => updateTemplate("lissDurationSeconds", value * 60)}
                />
                <NumberSetting
                  label="Core rounds"
                  value={template.rounds}
                  min={1}
                  max={10}
                  suffix="rounds"
                  onChange={(value) => updateTemplate("rounds", value)}
                />
                <NumberSetting
                  label="Rotation per side"
                  value={template.rotationSideDurationSeconds / 60}
                  min={0.25}
                  max={30}
                  step={0.25}
                  suffix="min"
                  onChange={(value) => updateTemplate("rotationSideDurationSeconds", value * 60)}
                />
                <NumberSetting
                  label="Cable crunch"
                  value={template.crunchDurationSeconds / 60}
                  min={0.25}
                  max={30}
                  step={0.25}
                  suffix="min"
                  onChange={(value) => updateTemplate("crunchDurationSeconds", value * 60)}
                />
                <NumberSetting
                  label="Anti-flexion holds"
                  value={template.antiFlexionHoldCount}
                  min={1}
                  max={10}
                  suffix="holds"
                  onChange={(value) => updateTemplate("antiFlexionHoldCount", value)}
                />
                <NumberSetting
                  label="Each hold"
                  value={template.antiFlexionHoldDurationSeconds}
                  min={10}
                  max={600}
                  step={5}
                  suffix="sec"
                  onChange={(value) => updateTemplate("antiFlexionHoldDurationSeconds", value)}
                />
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transitions</h3>
              <div className="grid grid-cols-2 gap-3">
                <NumberSetting
                  label="Treadmill → cable"
                  value={template.treadmillTransitionSeconds}
                  min={0}
                  max={1800}
                  step={5}
                  suffix="sec"
                  onChange={(value) => updateTemplate("treadmillTransitionSeconds", value)}
                />
                <NumberSetting
                  label="Between exercises"
                  value={template.betweenExerciseSeconds}
                  min={0}
                  max={600}
                  step={5}
                  suffix="sec"
                  onChange={(value) => updateTemplate("betweenExerciseSeconds", value)}
                />
                <NumberSetting
                  label="Between rounds"
                  value={template.betweenRoundSeconds}
                  min={0}
                  max={1800}
                  step={5}
                  suffix="sec"
                  onChange={(value) => updateTemplate("betweenRoundSeconds", value)}
                />
                <NumberSetting
                  label="Between holds"
                  value={template.antiFlexionResetSeconds}
                  min={0}
                  max={300}
                  step={5}
                  suffix="sec"
                  onChange={(value) => updateTemplate("antiFlexionResetSeconds", value)}
                />
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Exercise order</h3>
                <p className="mt-1 text-xs text-slate-500">Rotation side-switches and anti-flexion resets remain automatic.</p>
              </div>
              <div className="space-y-2">
                {template.exerciseOrder.map((exerciseId: CoreExerciseId, index) => (
                  <div key={exerciseId} className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-800">{CORE_EXERCISE_NAMES[exerciseId]}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${CORE_EXERCISE_NAMES[exerciseId]} up`}
                      disabled={index === 0}
                      onClick={() => moveExercise(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${CORE_EXERCISE_NAMES[exerciseId]} down`}
                      disabled={index === template.exerciseOrder.length - 1}
                      onClick={() => moveExercise(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-bold text-slate-900">Cable Setup for Today</h2>
            <p className="text-sm text-slate-500">Optional. Previous resistance, pulley position, and attachment are prefilled.</p>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            {cableSetup.useSideSpecificRotation ? (
              <div className="space-y-3">
                <CableSetupFields
                  label="Cable Rotation — Left"
                  setup={cableSetup.rotationLeft ?? {}}
                  onChange={(setup) => updateCableSetup({ rotationLeft: setup })}
                />
                <CableSetupFields
                  label="Cable Rotation — Right"
                  setup={cableSetup.rotationRight ?? {}}
                  onChange={(setup) => updateCableSetup({ rotationRight: setup })}
                />
              </div>
            ) : (
              <CableSetupFields
                label="Cable Rotation"
                setup={cableSetup.rotation}
                onChange={(setup) => updateCableSetup({ rotation: setup })}
              />
            )}

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={cableSetup.useSideSpecificRotation}
                onChange={(event) => handleSideSpecificChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-violet-600"
              />
              Use different rotation weight/setup by side
            </label>

            <div className="space-y-3">
              <CableSetupFields
                label="Cable Crunch"
                setup={cableSetup.crunch}
                onChange={(setup) => updateCableSetup({ crunch: setup })}
              />
              <CableSetupFields
                label="Cable Anti-Flexion"
                setup={cableSetup.antiFlexion}
                includeNote
                onChange={(setup) => updateCableSetup({ antiFlexion: setup })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardContent className="flex items-center gap-4 px-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${voiceCues ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
              {voiceCues ? <Volume2 /> : <VolumeX />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Voice Cues</p>
              <p className="text-xs text-slate-500">Optional spoken exercise and timing announcements. Tones and vibration remain on.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={voiceCues}
              onClick={() => handleVoiceChange(!voiceCues)}
              className={`relative h-7 w-12 rounded-full transition-colors ${voiceCues ? "bg-violet-600" : "bg-slate-300"}`}
            >
              <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${voiceCues ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button variant="outline" className="h-11 w-full" onClick={handleSaveDefault}>
            <Save /> Save Today&apos;s Workout as Default
          </Button>
          {savedMessage && <p className="text-center text-xs font-medium text-emerald-600">Default template updated.</p>}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-100 bg-white/95 p-4 backdrop-blur">
        <Button className="mx-auto h-12 w-full max-w-2xl bg-violet-600 text-base hover:bg-violet-700" onClick={handleStart}>
          <Play className="h-5 w-5 fill-current" /> Start Workout · {formatDuration(plannedSeconds)}
        </Button>
      </div>
    </div>
  )
}
