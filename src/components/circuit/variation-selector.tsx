"use client"

import { ExerciseVariation } from "@/types/workout"
import { cn } from "@/lib/utils"

interface VariationSelectorProps {
  value: ExerciseVariation
  onChange: (variation: ExerciseVariation) => void
  defaultVariation?: ExerciseVariation
  compact?: boolean
}

const VARIATIONS: { value: ExerciseVariation; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "standard", label: "Standard" },
  { value: "advanced", label: "Advanced" },
]

export function VariationSelector({
  value,
  onChange,
  defaultVariation,
  compact,
}: VariationSelectorProps) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5">
      {VARIATIONS.map((v) => {
        const isSelected = value === v.value
        const isDefault = defaultVariation === v.value

        return (
          <button
            key={v.value}
            onClick={() => onChange(v.value)}
            className={cn(
              "relative flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
              compact ? "px-1.5 py-1" : "px-2 py-1.5",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
            {isDefault && !isSelected && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
