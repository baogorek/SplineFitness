"use client"

import { useState } from "react"
import { History, RotateCcw, Timer, Trash2, X } from "lucide-react"
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
  FrontierChange,
  FrontierEntrySave,
  FrontierExercise,
  FrontierMetric,
  FrontierValue,
} from "@/types/frontier"

interface FrontierEntrySheetProps {
  exercise: FrontierExercise | null
  equipmentOptions: string[]
  onClose: () => void
  onSave: (entry: FrontierEntrySave) => void
  onUndo?: () => void
  onDelete?: () => void
  active?: boolean
  onTime?: (weight?: number) => void
  timerInUse?: boolean
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
  active = true,
  onTime,
  timerInUse = false,
}: FrontierEntrySheetProps) {
  const initialStructure = exercise ? getFrontierExerciseStructure(exercise) : null
  const savedChange = exercise ? getCurrentFrontierChange(exercise.metric, exercise.changes) : null
  const savedCurrent = exercise ? getCurrentFrontier(exercise.changes) : null
  const [name, setName] = useState(initialStructure?.name ?? "")
  const [equipment, setEquipment] = useState(initialStructure?.equipment ?? "")
  const [bodyPart, setBodyPart] = useState<FrontierBodyPart | "">(
    initialStructure?.bodyPart ?? ""
  )
  const [metric, setMetric] = useState<FrontierMetric>(exercise?.metric ?? "reps")
  // Untouched fields follow a newly confirmed timer mark; actual drafts stay intact.
  const [primaryDraft, setPrimary] = useState<string | null>(null)
  const primary = primaryDraft ?? (savedCurrent ? String(savedCurrent.primary) : "")
  const [durationDraft, setDuration] = useState<string | null>(null)
  const duration = durationDraft ?? (metric === "weight-time"
    ? formatDurationInput(savedCurrent?.secondary)
    : metric.startsWith("duration")
      ? formatDurationInput(savedCurrent?.primary)
      : ""
  )
  const [customMarkDraft, setCustomMark] = useState<string | null>(null)
  const customMark = customMarkDraft ?? (exercise?.metric === "freeform" ? savedChange?.rawValue ?? "" : "")
  const [correcting, setCorrecting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showMetricOptions, setShowMetricOptions] = useState(!exercise || exercise.changes.length === 0)

  const metricChanged = Boolean(exercise && metric !== exercise.metric)
  const currentChange = metricChanged ? null : savedChange
  const current = metricChanged ? null : savedCurrent
  const historyCount = (exercise?.changes.length ?? 0)
    + (exercise?.metricHistory ?? []).reduce((count, history) => count + history.changes.length, 0)
  const hasHistory = historyCount > 0 || Boolean(exercise?.metricHistory?.length)

  const dialogRef = useDialogFocus<HTMLElement>(active, onClose)

  const parsedValue = ((): FrontierValue | null => {
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
  })()

  const rawValue = metric === "freeform" ? customMark.trim() || null : null
  const hasMeasure = Boolean(parsedValue || rawValue)
  const detailsChanged = Boolean(
    exercise
      && (
        name.trim() !== initialStructure?.name
        || equipment.trim() !== initialStructure?.equipment
        || bodyPart !== initialStructure?.bodyPart
        || metricChanged
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
      && (!exercise || metricChanged
        ? hasMeasure || measureFieldsEmpty
        : hasMeasure
          ? (correcting && valueChanged) || improvement || (detailsChanged && !valueChanged)
          : detailsChanged && measureFieldsEmpty)
  )

  const handleMetricChange = (nextMetric: FrontierMetric) => {
    if (nextMetric === metric) return
    setMetric(nextMetric)
    setCorrecting(false)
    const restoring = nextMetric === exercise?.metric
    setPrimary(restoring && savedCurrent ? String(savedCurrent.primary) : "")
    setDuration(restoring
      ? nextMetric === "weight-time"
        ? formatDurationInput(savedCurrent?.secondary)
        : nextMetric.startsWith("duration")
          ? formatDurationInput(savedCurrent?.primary)
          : ""
      : "")
    setCustomMark(restoring && nextMetric === "freeform" ? savedChange?.rawValue ?? "" : "")
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
      valueAction: !hasMeasure
        ? "none"
        : !exercise || metricChanged
          ? "progress"
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
  const invalidFrontier = Boolean(exercise && !metricChanged && hasMeasure && valueChanged && !improvement && !correcting)
  const invalidMeasure = !hasMeasure && !measureFieldsEmpty
  const proposedMark = formatFrontierChange(metric, {
    id: "draft", kind: "correction", value: parsedValue ?? undefined, rawValue: rawValue ?? undefined,
  })

  return (
    <div className={active ? "fixed inset-0 z-[70] flex items-end justify-center sm:items-center" : "hidden"}>
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
              {exercise ? (correcting ? "Correct record" : "Edit exercise") : "New exercise"}
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
          {exercise && onTime && (
            <div className="space-y-2">
              <Button variant="outline" className="h-12 w-full border-indigo-200 text-indigo-700" disabled={timerInUse} onClick={() => onTime(metric === "weight-time" && Number(primary) > 0 ? Number(primary) : undefined)}>
                <Timer className="mr-2 h-4 w-4" />{timerInUse ? "Finish the active timer to start another" : "Time this exercise"}
              </Button>
              <p className="text-xs text-slate-500">Your edits stay here while you time the exercise. Frontier suggestions use the saved measurement and mark.</p>
            </div>
          )}
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

          {!showMetricOptions && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-xs text-slate-500">Measurement</p>
                <p className="text-sm font-semibold text-slate-800">{selectedMetric?.shortLabel}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-label="Change measurement"
                aria-expanded={false}
                onClick={() => setShowMetricOptions(true)}
              >
                Change
              </Button>
            </div>
          )}

          {showMetricOptions && (
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

          {metricChanged && (
            <p role="status" className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              This starts a new frontier. Add a starting mark now or leave it blank.
              {exercise && exercise.changes.length > 0 && (
                <> Previous marks stay in history as {FRONTIER_METRIC_OPTIONS.find((option) => option.value === exercise.metric)?.shortLabel}.</>
              )}
            </p>
          )}

          {exercise && currentChange && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                    Your frontier
                  </p>
                  <p className="mt-1 break-words font-mono text-2xl font-bold text-indigo-950">
                    {formatFrontierChange(metric, currentChange)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-11 shrink-0 border-indigo-200 bg-white text-indigo-700"
                  onClick={() => setCorrecting((value) => !value)}
                >
                  {correcting ? "Cancel correction" : "Correct record"}
                </Button>
              </div>
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

          {invalidMeasure && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Enter a valid performance measure.{!currentChange && " You can also leave the measure fields blank and add it later."}
            </p>
          )}

          {invalidFrontier && (
            <div className="space-y-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p>This does not improve your frontier. If the saved record is wrong, you can correct it.</p>
              <Button
                variant="outline"
                className="h-auto min-h-11 w-full whitespace-normal border-amber-300 bg-white px-3 py-2 text-amber-900"
                onClick={() => setCorrecting(true)}
              >
                Correct {formatFrontierChange(metric, currentChange)} → {proposedMark}
              </Button>
            </div>
          )}

          {correcting && (
            <div role="status" className="space-y-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="break-words font-semibold">
                {hasMeasure && valueChanged
                  ? `Correct ${formatFrontierChange(metric, currentChange)} → ${proposedMark}`
                  : "Enter the correct record."}
              </p>
              <p>Your previous record stays in history. This correction won&apos;t count as a new effort.</p>
            </div>
          )}

          <Button
            size="lg"
            className="h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={!canSave}
            onClick={handleSubmit}
          >
            {!exercise
              ? hasMeasure ? "Set frontier" : "Add exercise"
              : metricChanged
                ? "Save measurement"
                : correcting
                  ? "Save correction"
                : detailsChanged && !valueChanged
                  ? "Save exercise"
                  : currentChange ? "Update frontier" : "Set frontier"}
          </Button>

          {exercise && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex flex-wrap gap-2">
                {!metricChanged && exercise.changes.length > 1 && onUndo && (
                  <Button variant="outline" size="sm" onClick={onUndo}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Undo last change
                  </Button>
                )}
                {hasHistory && (
                  <Button variant="ghost" size="sm" aria-expanded={showHistory} onClick={() => setShowHistory((value) => !value)}>
                    <History className="mr-1.5 h-3.5 w-3.5" />
                    {showHistory ? "Hide history" : `History (${historyCount})`}
                  </Button>
                )}
              </div>

              {showHistory && hasHistory && (
                <div className="mt-3 space-y-4">
                  {exercise.changes.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        {FRONTIER_METRIC_OPTIONS.find((option) => option.value === exercise.metric)?.shortLabel}
                      </p>
                      <FrontierHistoryList metric={exercise.metric} changes={exercise.changes} currentId={savedChange?.id} />
                    </div>
                  )}
                  {[...(exercise.metricHistory ?? [])].reverse().map((history) => (
                    <div key={history.id}>
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        {FRONTIER_METRIC_OPTIONS.find((option) => option.value === history.metric)?.shortLabel}
                        {" · Previous measurement · "}{new Date(history.endedAt).toLocaleDateString()}
                      </p>
                      <FrontierHistoryList metric={history.metric} changes={history.changes} />
                      {history.attempts.length > 0 && (
                        <p className="mt-2 text-xs text-slate-400">
                          Tried on {history.attempts.map((attempt) => new Date(attempt.attemptedAt).toLocaleDateString()).join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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

function FrontierHistoryList({ metric, changes, currentId }: {
  metric: FrontierMetric
  changes: FrontierChange[]
  currentId?: string
}) {
  if (changes.length === 0) return null
  return (
    <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
      {[...changes].reverse().map((change, reverseIndex) => {
        const previous = change.kind === "correction"
          ? getCurrentFrontierChange(metric, changes.slice(0, changes.length - 1 - reverseIndex))
          : null
        return (
          <li key={change.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0 break-words">
              {change.kind === "correction" && (
                <span className="block text-xs font-semibold text-amber-700">Corrected</span>
              )}
              <span className="font-mono font-semibold text-slate-800">
                {previous && <>{formatFrontierChange(metric, previous)} → </>}
                {formatFrontierChange(metric, change)}
              </span>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {change.id === currentId
                ? "Current"
                : change.recordedAt
                  ? new Date(change.recordedAt).toLocaleDateString()
                  : "Imported"}
            </span>
          </li>
        )
      })}
    </ol>
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
    reps: { label: "Best single set", suffix: "reps", step: "1" },
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
      description={metric === "reps" ? "Your personal frontier" : undefined}
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
  description,
  onChange,
}: {
  id: string
  label: string
  value: string
  suffix: string
  step: string
  optional?: boolean
  description?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}{optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      {description && <p id={`${id}-help`} className="text-sm text-slate-500">{description}</p>}
      <div className="relative">
        <Input
          id={id}
          type="number"
          min="0"
          step={step}
          inputMode="decimal"
          aria-describedby={`${description ? `${id}-help ` : ""}${id}-unit`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 pr-14 font-mono text-base"
        />
        <span id={`${id}-unit`} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
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
        inputMode="text"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="e.g. 6.6 or 1:30"
        className="h-12 font-mono text-base"
      />
      <p className="text-[11px] text-slate-400">
        {optional && "Add now or later. "}Use seconds (6.6), minutes:seconds (1:30.5), or 1m30s.
      </p>
    </div>
  )
}
