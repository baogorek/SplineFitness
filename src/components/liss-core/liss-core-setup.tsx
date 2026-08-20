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
  CARDIO_MODALITY_LABELS,
  getPlannedWorkoutSeconds,
  normalizeLissCoreTemplate,
  WORK_BLOCK_NAMES,
} from "@/data/liss-core"
import {
  CableExerciseSetup,
  CardioIntervalSelection,
  CardioModality,
  LissCoreCableSetup,
  LissCoreTemplate,
  LissCoreTemplateBlock,
} from "@/types/workout"

interface LissCoreSetupProps {
  initialTemplate: LissCoreTemplate
  previousCableSetup: LissCoreCableSetup
  initialVoiceCues: boolean
  onBack: () => void
  onStart: (
    template: LissCoreTemplate,
    cableSetup: LissCoreCableSetup,
    cardioSelections: Record<string, CardioIntervalSelection>,
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
            placeholder="e.g. rope"
            onChange={(event) => onChange({ ...setup, attachment: event.target.value || undefined })}
          />
        </label>
      </div>
      {includeNote && (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Setup note</span>
          <Input
            value={setup.setupNote ?? ""}
            placeholder="e.g. stance or distance from cable"
            onChange={(event) => onChange({ ...setup, setupNote: event.target.value || undefined })}
          />
        </label>
      )}
    </div>
  )
}

export function CardioModalityFields({
  label,
  selection,
  onChange,
}: {
  label: string
  selection?: CardioIntervalSelection
  onChange: (selection: CardioIntervalSelection) => void
}) {
  return (
    <div className="space-y-2 rounded-xl border bg-slate-50 p-3">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        <select
          value={selection?.modality ?? ""}
          onChange={(event) => {
            const modality = event.target.value as CardioModality | ""
            onChange({
              ...selection,
              modality: modality || undefined,
              ...(modality !== "other" && { otherLabel: undefined }),
            })
          }}
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Not selected</option>
          {(Object.entries(CARDIO_MODALITY_LABELS) as [CardioModality, string][]).map(([value, optionLabel]) => (
            <option key={value} value={value}>{optionLabel}</option>
          ))}
        </select>
      </label>
      {selection?.modality === "other" && (
        <Input
          value={selection.otherLabel ?? ""}
          placeholder="Cardio modality"
          onChange={(event) => onChange({ ...selection, otherLabel: event.target.value || undefined })}
        />
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
          inputMode="decimal"
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
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  )
}

function blockOccurrenceLabel(blocks: LissCoreTemplateBlock[], block: LissCoreTemplateBlock): string {
  const matching = blocks.filter((candidate) => candidate.kind === block.kind)
  if (matching.length <= 1) return WORK_BLOCK_NAMES[block.kind]
  return `${WORK_BLOCK_NAMES[block.kind]} ${matching.findIndex((candidate) => candidate.id === block.id) + 1}`
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
    backExtension: {
      attachment: "Rope",
      ...previousCableSetup.backExtension,
    },
  }))
  const [cardioSelections, setCardioSelections] = useState<Record<string, CardioIntervalSelection>>({})
  const [voiceCues, setVoiceCues] = useState(initialVoiceCues)
  const [savedMessage, setSavedMessage] = useState(false)

  const plannedSeconds = useMemo(() => getPlannedWorkoutSeconds(template), [template])
  const cardioBlocks = template.blocks.filter((block) => block.kind === "cardio")

  const updateBlock = (id: string, patch: Partial<LissCoreTemplateBlock>) => {
    setTemplate((current) => ({
      ...current,
      blocks: current.blocks.map((block) => block.id === id ? { ...block, ...patch } : block),
    }))
    setSavedMessage(false)
  }

  const updateCableSetup = (patch: Partial<LissCoreCableSetup>) => {
    setCableSetup((current) => ({ ...current, ...patch }))
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= template.blocks.length) return
    const blocks = [...template.blocks]
    const currentTransition = blocks[index].transitionAfterSeconds
    const nextTransition = blocks[nextIndex].transitionAfterSeconds
    ;[blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]]
    blocks[index] = { ...blocks[index], transitionAfterSeconds: currentTransition }
    blocks[nextIndex] = { ...blocks[nextIndex], transitionAfterSeconds: nextTransition }
    setTemplate((current) => ({ ...current, blocks }))
    setSavedMessage(false)
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-violet-50 to-white">
      <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>
          <span className="text-xs font-bold tracking-wider text-violet-700">LISS + CORE ENDURANCE</span>
          <div className="w-16" aria-hidden="true" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-4 p-4 pb-28">
        <div className="py-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Today&apos;s workout</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">LISS + Core Endurance</h1>
          <p className="mt-2 text-sm text-slate-500">{formatDuration(plannedSeconds)} planned · {template.blocks.length} work blocks</p>
        </div>

        <Card className="gap-4 border-violet-200 py-5">
          <CardHeader className="px-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-violet-600" />
              <h2 className="font-bold text-slate-900">Edit Today&apos;s Workout</h2>
            </div>
            <p className="text-sm text-slate-500">Every work and transition duration is editable. Changes remain session-only unless explicitly saved as the default.</p>
          </CardHeader>
          <CardContent className="space-y-2 px-5">
            {template.blocks.map((block, index) => (
              <div key={block.id} className="rounded-xl border bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{index + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-slate-800">{blockOccurrenceLabel(template.blocks, block)}</span>
                  <Button variant="ghost" size="icon-sm" aria-label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Move block ${index + 1} down`} disabled={index === template.blocks.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown /></Button>
                </div>
                <div className={`mt-3 grid gap-3 ${index < template.blocks.length - 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  <NumberSetting
                    label={block.kind === "rotation" ? "Work per side" : "Work duration"}
                    value={block.durationSeconds / 60}
                    min={block.kind === "cardio" ? 1 : 0.25}
                    max={240}
                    step={0.25}
                    suffix="min"
                    onChange={(value) => updateBlock(block.id, { durationSeconds: value * 60 })}
                  />
                  {index < template.blocks.length - 1 && (
                    <NumberSetting
                      label="Transition after"
                      value={block.transitionAfterSeconds}
                      min={0}
                      max={1800}
                      step={5}
                      suffix="sec"
                      onChange={(value) => updateBlock(block.id, { transitionAfterSeconds: value })}
                    />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-bold text-slate-900">Cardio for Today</h2>
            <p className="text-sm text-slate-500">Optional. Select a modality for each cardio interval; you can also change it while the timer runs.</p>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 sm:grid-cols-2">
            {cardioBlocks.map((block, index) => (
              <CardioModalityFields
                key={block.id}
                label={`Cardio ${index + 1} · ${formatDuration(block.durationSeconds)}`}
                selection={cardioSelections[block.id]}
                onChange={(selection) => setCardioSelections((current) => ({ ...current, [block.id]: selection }))}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-bold text-slate-900">Cable Setup for Today</h2>
            <p className="text-sm text-slate-500">Previous resistance, pulley position, attachment, and setup notes are prefilled.</p>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            {cableSetup.useSideSpecificRotation ? (
              <div className="space-y-3">
                <CableSetupFields label="Cable Rotation — Left" setup={cableSetup.rotationLeft ?? {}} onChange={(setup) => updateCableSetup({ rotationLeft: setup })} />
                <CableSetupFields label="Cable Rotation — Right" setup={cableSetup.rotationRight ?? {}} onChange={(setup) => updateCableSetup({ rotationRight: setup })} />
              </div>
            ) : (
              <CableSetupFields label="Cable Rotation" setup={cableSetup.rotation} onChange={(setup) => updateCableSetup({ rotation: setup })} />
            )}
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={cableSetup.useSideSpecificRotation} onChange={(event) => handleSideSpecificChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
              Use different rotation weight/setup by side
            </label>
            <CableSetupFields label="Cable Crunch" setup={cableSetup.crunch} onChange={(setup) => updateCableSetup({ crunch: setup })} />
            <CableSetupFields label="Cable Back Extension" setup={cableSetup.backExtension} includeNote onChange={(setup) => updateCableSetup({ backExtension: setup })} />
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardContent className="flex items-center gap-4 px-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${voiceCues ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"}`}>{voiceCues ? <Volume2 /> : <VolumeX />}</div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Voice Cues</p>
              <p className="text-xs text-slate-500">Optional spoken announcements. Tones and vibration remain on.</p>
            </div>
            <button type="button" role="switch" aria-checked={voiceCues} onClick={() => handleVoiceChange(!voiceCues)} className={`relative h-7 w-12 rounded-full transition-colors ${voiceCues ? "bg-violet-600" : "bg-slate-300"}`}>
              <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${voiceCues ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button variant="outline" className="h-11 w-full" onClick={handleSaveDefault}><Save /> Save Today&apos;s Workout as Default</Button>
          {savedMessage && <p className="text-center text-xs font-medium text-emerald-600">Default template updated.</p>}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-100 bg-white/95 p-4 backdrop-blur">
        <Button className="mx-auto h-12 w-full max-w-2xl bg-violet-600 text-base hover:bg-violet-700" onClick={() => onStart(normalizeLissCoreTemplate(template), cableSetup, cardioSelections, voiceCues)}>
          <Play className="h-5 w-5 fill-current" /> Start Workout · {formatDuration(plannedSeconds)}
        </Button>
      </div>
    </div>
  )
}
