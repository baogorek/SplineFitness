"use client"

import { useEffect, useMemo, useState } from "react"
import { History, RotateCcw, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  formatDurationInput,
  formatFrontierValue,
  FRONTIER_METRIC_OPTIONS,
  getCurrentFrontier,
  isFrontierImprovement,
  parseDuration,
} from "@/lib/frontier-utils"
import { cn } from "@/lib/utils"
import { FrontierExercise, FrontierMetric, FrontierValue } from "@/types/frontier"

export interface FrontierEntrySave {
  name: string
  metric: FrontierMetric
  value: FrontierValue | null
  valueAction: "progress" | "correction" | "unchanged" | "none"
}

interface FrontierEntrySheetProps {
  exercise: FrontierExercise | null
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
  onClose,
  onSave,
  onUndo,
  onDelete,
}: FrontierEntrySheetProps) {
  const current = exercise ? getCurrentFrontier(exercise.changes) : null
  const [name, setName] = useState(exercise?.name ?? "")
  const [metric, setMetric] = useState<FrontierMetric>(exercise?.metric ?? "reps")
  const [primary, setPrimary] = useState(current ? String(current.primary) : "")
  const [duration, setDuration] = useState(
    metric === "weight-time"
      ? formatDurationInput(current?.secondary)
      : metric.startsWith("duration")
        ? formatDurationInput(current?.primary)
        : ""
  )
  const [correcting, setCorrecting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const parsedValue = useMemo<FrontierValue | null>(() => {
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

  const nameChanged = Boolean(exercise && name.trim() !== exercise.name)
  const valueChanged = parsedValue ? !valuesMatch(current, parsedValue) : false
  const improvement = parsedValue
    ? isFrontierImprovement(metric, current, parsedValue)
    : false
  const measureFieldsEmpty = metric === "weight-time"
    ? !primary.trim() && !duration.trim()
    : metric.startsWith("duration")
      ? !duration.trim()
      : !primary.trim()
  const canSave = Boolean(
    name.trim()
      && (!exercise
        ? parsedValue || measureFieldsEmpty
        : parsedValue
          ? correcting || improvement || (nameChanged && !valueChanged)
          : nameChanged && measureFieldsEmpty)
  )

  const handleMetricChange = (nextMetric: FrontierMetric) => {
    setMetric(nextMetric)
    setPrimary("")
    setDuration("")
  }

  const handleSubmit = () => {
    if (!canSave) return
    onSave({
      name: name.trim(),
      metric,
      value: parsedValue,
      valueAction: !exercise
        ? parsedValue ? "progress" : "none"
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
  const invalidFrontier = Boolean(
    exercise && parsedValue && valueChanged && !improvement && !correcting
  )
  const invalidNewMeasure = Boolean(!exercise && !parsedValue && !measureFieldsEmpty)

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="frontier-entry-title"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              {exercise ? (correcting ? "Correct the card" : "Move the frontier") : "New exercise"}
            </p>
            <h2 id="frontier-entry-title" className="mt-1 text-xl font-bold text-slate-900">
              {exercise?.name ?? "Add a row"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="frontier-name" className="text-sm font-semibold text-slate-700">
              Exercise
            </label>
            <Input
              id="frontier-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Exercise name"
              autoFocus={!exercise}
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
                    onClick={() => handleMetricChange(option.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
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

          {exercise && current && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
                Current frontier
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-indigo-950">
                {formatFrontierValue(metric, current)}
              </p>
              <p className="mt-1 text-xs text-indigo-700/70">{selectedMetric?.description}</p>
            </div>
          )}

          <FrontierValueFields
            metric={metric}
            primary={primary}
            duration={duration}
            allowEmpty={!current}
            onPrimaryChange={setPrimary}
            onDurationChange={setDuration}
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
              ? parsedValue ? "Add to card" : "Add exercise"
              : correcting
                ? "Save correction"
                : nameChanged && !valueChanged
                  ? "Save name"
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
                          {formatFrontierValue(exercise.metric, change.value)}
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
                          : new Date(change.recordedAt).toLocaleDateString()}
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
  allowEmpty: boolean
  onPrimaryChange: (value: string) => void
  onDurationChange: (value: string) => void
}

function FrontierValueFields({
  metric,
  primary,
  duration,
  allowEmpty,
  onPrimaryChange,
  onDurationChange,
}: FrontierValueFieldsProps) {
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
