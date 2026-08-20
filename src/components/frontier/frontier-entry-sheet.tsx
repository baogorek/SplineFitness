"use client"

import { useMemo, useState } from "react"
import { History, RotateCcw, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  formatDurationInput,
  formatFrontierChange,
  FRONTIER_METRIC_OPTIONS,
  getCurrentFrontier,
  getCurrentFrontierChange,
  isFrontierImprovement,
  parseDuration,
} from "@/lib/frontier-utils"
import { useDialogFocus } from "@/hooks/use-dialog-focus"
import {
  FRONTIER_BODY_PARTS,
  getFrontierExerciseStructure,
} from "@/lib/frontier-structure"
import { cn } from "@/lib/utils"
import {
  FrontierBodyPart,
  FrontierExercise,
  FrontierMetric,
  FrontierValue,
} from "@/types/frontier"

export interface FrontierEntrySave {
  name: string
  equipment: string
  bodyPart: FrontierBodyPart
  metric: FrontierMetric
  value: FrontierValue | null
  rawValue: string | null
  valueAction: "progress" | "correction" | "unchanged" | "none"
}

interface FrontierEntrySheetProps {
  exercise: FrontierExercise | null
  equipmentOptions: string[]
  onClose: () => void
  onSave: (entry: FrontierEntrySave) => void
  onUndo?: () => void
  onDelete?: () => void
}

function valuesMatch(a: FrontierValue | null, b: FrontierValue): boolean {
  return a?.primary === b.primary && (a.secondary ?? 0) === (b.secondary ?? 0)
}

export function FrontierEntrySheet({
  exercise,
  equipmentOptions,
  onClose,
  onSave,
  onUndo,
  onDelete,
}: FrontierEntrySheetProps) {
  const initialStructure = exercise ? getFrontierExerciseStructure(exercise) : null
  const currentChange = exercise ? getCurrentFrontierChange(exercise.metric, exercise.changes) : null
  const current = exercise ? getCurrentFrontier(exercise.changes) : null
  const [name, setName] = useState(initialStructure?.name ?? "")
  const [equipment, setEquipment] = useState(initialStructure?.equipment ?? "")
  const [bodyPart, setBodyPart] = useState<FrontierBodyPart | "">(
    initialStructure?.bodyPart ?? ""
  )
  const [metric, setMetric] = useState<FrontierMetric>(exercise?.metric ?? "reps")
  const [primary, setPrimary] = useState(current ? String(current.primary) : "")
  const [duration, setDuration] = useState(
    metric === "weight-time"
      ? formatDurationInput(current?.secondary)
      : metric.startsWith("duration")
        ? formatDurationInput(current?.primary)
        : ""
  )
  const [customMark, setCustomMark] = useState(
    exercise?.metric === "freeform" ? currentChange?.rawValue ?? "" : ""
  )
  const [correcting, setCorrecting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const dialogRef = useDialogFocus<HTMLElement>(true, onClose)

  const parsedValue = useMemo<FrontierValue | null>(() => {
    if (metric === "freeform") return null

    if (metric === "weight-time") {
      const weight = Number(primary)
      if (!Number.isFinite(weight) || weight <= 0) return null

      if (!duration.trim()) return { primary: weight }

      const seconds = parseDuration(duration)
      if (seconds === null || seconds <= 0) return null
      return { primary: weight, secondary: seconds }
    }

    if (metric === "duration-longer" || metric === "duration-faster") {
      const seconds = parseDuration(duration)
      return seconds !== null && seconds > 0 ? { primary: seconds } : null
    }

    const value = Number(primary)
    if (!Number.isFinite(value) || value <= 0) return null
    if (metric === "reps" && !Number.isInteger(value)) return null
    return { primary: value }
  }, [duration, metric, primary])

  const rawValue = metric === "freeform" ? customMark.trim() || null : null
  const hasMeasure = Boolean(parsedValue || rawValue)
  const detailsChanged = Boolean(
    exercise
      && (
        name.trim() !== initialStructure?.name
        || equipment.trim() !== initialStructure?.equipment
        || bodyPart !== initialStructure?.bodyPart
      )
  )
  const valueChanged = metric === "freeform"
    ? Boolean(rawValue && rawValue !== (currentChange?.rawValue ?? ""))
    : parsedValue ? !valuesMatch(current, parsedValue) : false
  const improvement = metric === "freeform"
    ? Boolean(rawValue && (!currentChange || valueChanged))
    : parsedValue
      ? isFrontierImprovement(metric, current, parsedValue)
      : false
  const measureFieldsEmpty = metric === "weight-time"
    ? !primary.trim() && !duration.trim()
    : metric.startsWith("duration")
      ? !duration.trim()
      : metric === "freeform"
        ? !customMark.trim()
        : !primary.trim()
  const canSave = Boolean(
    name.trim()
      && equipment.trim()
      && bodyPart
      && (!exercise
        ? hasMeasure || measureFieldsEmpty
        : hasMeasure
          ? correcting || improvement || (detailsChanged && !valueChanged)
          : detailsChanged && measureFieldsEmpty)
  )

  const handleMetricChange = (nextMetric: FrontierMetric) => {
    setMetric(nextMetric)
    setPrimary("")
    setDuration("")
    setCustomMark("")
  }

  const handleSubmit = () => {
    if (!canSave || !bodyPart) return
    onSave({
      name: name.trim(),
      equipment: equipment.trim(),
      bodyPart,
      metric,
      value: parsedValue,
      rawValue,
      valueAction: !exercise
        ? hasMeasure ? "progress" : "none"
        : !valueChanged
          ? "unchanged"
          : correcting
            ? "correction"
            : "progress",
    })
  }

  const handleDelete = () => {
    if (!onDelete || !exercise) return
    if (window.confirm(`Remove ${exercise.name} from this card?`)) onDelete()
  }

  const selectedMetric = FRONTIER_METRIC_OPTIONS.find((option) => option.value === metric)
  const invalidFrontier = Boolean(exercise && hasMeasure && valueChanged && !improvement && !correcting)
  const invalidNewMeasure = Boolean(!exercise && !hasMeasure && !measureFieldsEmpty)

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frontier-entry-title"
        tabIndex={-1}
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              {exercise ? (correcting ? "Correct frontier" : "Edit exercise") : "New exercise"}
            </p>
            <h2 id="frontier-entry-title" className="mt-1 text-xl font-bold text-slate-900">
              {initialStructure?.name ?? "Add a row"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="frontier-equipment" className="text-sm font-semibold text-slate-700">
              Station / area
            </label>
            <Input
              id="frontier-equipment"
              list="frontier-equipment-options"
              value={equipment}
              onChange={(event) => setEquipment(event.target.value)}
              placeholder="e.g. Multitrainer or Cable by mirrors"
              autoComplete="off"
              autoFocus={!exercise}
              className="h-11"
            />
            <datalist id="frontier-equipment-options">
              {equipmentOptions.map((option) => <option key={option} value={option} />)}
            </datalist>
            <p className="text-[11px] text-slate-400">
              Group by where you perform the exercise, even if the equipment is not physically attached.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Body part</p>
            <div className="grid grid-cols-3 gap-2">
              {FRONTIER_BODY_PARTS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={bodyPart === option}
                  onClick={() => setBodyPart(option)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                    bodyPart === option
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="frontier-name" className="text-sm font-semibold text-slate-700">
              Exercise
            </label>
            <Input
              id="frontier-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Exercise name"
              className="h-11"
            />
          </div>

          {(!exercise || exercise.changes.length === 0) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">What moves forward?</p>
              <div className="grid grid-cols-2 gap-2">
                {FRONTIER_METRIC_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={metric === option.value}
                    onClick={() => handleMetricChange(option.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      option.value === "freeform" && "col-span-2",
                      metric === option.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-950"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span className="block text-sm font-semibold">{option.shortLabel}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {exercise && currentChange && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
                Current frontier
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-indigo-950">
                {formatFrontierChange(metric, currentChange)}
              </p>
              <p className="mt-1 text-xs text-indigo-700/70">{selectedMetric?.description}</p>
            </div>
          )}

          <FrontierValueFields
            metric={metric}
            primary={primary}
            duration={duration}
            customMark={customMark}
            allowEmpty={!currentChange}
            onPrimaryChange={setPrimary}
            onDurationChange={setDuration}
            onCustomMarkChange={setCustomMark}
          />

          {invalidNewMeasure && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Enter a valid performance measure, or leave the measure fields blank and add it later.
            </p>
          )}

          {invalidFrontier && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This does not exceed the current frontier. Use correction mode if the card is wrong.
            </p>
          )}

          {correcting && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Correction mode allows the frontier to move backward. The previous value remains available in change history.
            </p>
          )}

          <Button
            size="lg"
            className="h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!canSave}
            onClick={handleSubmit}
          >
            {!exercise
              ? hasMeasure ? "Add to card" : "Add exercise"
                : correcting
                  ? "Save correction"
                : detailsChanged && !valueChanged
                  ? "Save exercise"
                  : "Update frontier"}
          </Button>

          {exercise && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCorrecting((value) => !value)}
                  className={cn(correcting && "border-amber-300 bg-amber-50 text-amber-800")}
                >
                  Correct value
                </Button>
                {exercise.changes.length > 1 && onUndo && (
                  <Button variant="outline" size="sm" onClick={onUndo}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Undo last change
                  </Button>
                )}
                {exercise.changes.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory((value) => !value)}>
                    <History className="mr-1.5 h-3.5 w-3.5" />
                    {showHistory ? "Hide history" : `History (${exercise.changes.length})`}
                  </Button>
                )}
              </div>

              {showHistory && exercise.changes.length > 0 && (
                <ol className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
                  {[...exercise.changes].reverse().map((change, index) => (
                    <li key={change.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div>
                        <span className="font-mono font-semibold text-slate-800">
                          {formatFrontierChange(exercise.metric, change)}
                        </span>
                        {change.kind === "correction" && (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-amber-600">
                            correction
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {index === 0
                          ? "Current"
                          : change.recordedAt
                            ? new Date(change.recordedAt).toLocaleDateString()
                            : "Imported"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="mt-4 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove exercise
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

interface FrontierValueFieldsProps {
  metric: FrontierMetric
  primary: string
  duration: string
  customMark: string
  allowEmpty: boolean
  onPrimaryChange: (value: string) => void
  onDurationChange: (value: string) => void
  onCustomMarkChange: (value: string) => void
}

function FrontierValueFields({
  metric,
  primary,
  duration,
  customMark,
  allowEmpty,
  onPrimaryChange,
  onDurationChange,
  onCustomMarkChange,
}: FrontierValueFieldsProps) {
  if (metric === "freeform") {
    return (
      <div className="space-y-2">
        <label htmlFor="frontier-custom-mark" className="text-sm font-semibold text-slate-700">
          Mark{allowEmpty && <span className="font-normal text-slate-400"> (optional)</span>}
        </label>
        <Input
          id="frontier-custom-mark"
          value={customMark}
          onChange={(event) => onCustomMarkChange(event.target.value)}
          placeholder="e.g. BW / 1:00 or pin 5"
          className="h-12 font-mono text-base"
        />
        <p className="text-[11px] text-slate-400">Any text is allowed; the newest mark becomes current.</p>
      </div>
    )
  }

  if (metric === "weight-time") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="frontier-weight"
          label="Weight"
          value={primary}
          suffix="lb"
          step="any"
          optional={allowEmpty}
          onChange={onPrimaryChange}
        />
        <DurationField value={duration} onChange={onDurationChange} optional />
      </div>
    )
  }

  if (metric === "duration-longer" || metric === "duration-faster") {
    return <DurationField value={duration} onChange={onDurationChange} optional={allowEmpty} />
  }

  const configuration = {
    reps: { label: "Repetitions", suffix: "reps", step: "1" },
    weight: { label: "Weight", suffix: "lb", step: "any" },
    speed: { label: "Speed", suffix: "mph", step: "any" },
  }[metric]

  return (
    <NumberField
      id="frontier-primary"
      label={configuration.label}
      value={primary}
      suffix={configuration.suffix}
      step={configuration.step}
      optional={allowEmpty}
      onChange={onPrimaryChange}
    />
  )
}

function NumberField({
  id,
  label,
  value,
  suffix,
  step,
  optional = false,
  onChange,
}: {
  id: string
  label: string
  value: string
  suffix: string
  step: string
  optional?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}{optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min="0"
          step={step}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 pr-14 font-mono text-base"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {suffix}
        </span>
      </div>
    </div>
  )
}

function DurationField({
  value,
  onChange,
  optional = false,
}: {
  value: string
  onChange: (value: string) => void
  optional?: boolean
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="frontier-duration" className="text-sm font-semibold text-slate-700">
        Time{optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      <Input
        id="frontier-duration"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        placeholder="e.g. 1:30"
        className="h-12 font-mono text-base"
      />
      <p className="text-[11px] text-slate-400">
        {optional ? "Add now or later. Use 1:30, 90, or 1m30s" : "Use 1:30, 90, or 1m30s"}
      </p>
    </div>
  )
}
