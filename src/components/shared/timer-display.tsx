"use client"

import { cn } from "@/lib/utils"

interface TimerDisplayProps {
  time: string
  label?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "countdown" | "countup"
  className?: string
}

export function TimerDisplay({
  time,
  label,
  size = "md",
  variant = "default",
  className,
}: TimerDisplayProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  }

  const variantClasses = {
    default: "text-foreground",
    countdown: "text-primary",
    countup: "text-muted-foreground",
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </span>
      )}
      <span
        className={cn(
          "font-mono font-bold tabular-nums",
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        {time}
      </span>
    </div>
  )
}
