"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DURATION_OPTIONS = [
  { value: "30", label: "30s" },
  { value: "45", label: "45s" },
  { value: "60", label: "60s" },
  { value: "75", label: "75s" },
  { value: "90", label: "90s" },
  { value: "105", label: "105s" },
  { value: "120", label: "2m" },
]

interface DurationSelectorProps {
  value: number
  onChange: (value: number) => void
  compact?: boolean
}

export function DurationSelector({ value, onChange, compact }: DurationSelectorProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v, 10))}
    >
      <SelectTrigger size="sm" className={compact ? "w-16" : "w-20"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DURATION_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface GlobalDurationControlProps {
  onSetAll: (seconds: number) => void
}

const GLOBAL_PRESETS = [
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
]

export function GlobalDurationControl({ onSetAll }: GlobalDurationControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Set all to:</span>
      {GLOBAL_PRESETS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSetAll(opt.value)}
          className="px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
