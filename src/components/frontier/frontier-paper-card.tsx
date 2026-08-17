"use client"

import { useRef } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFrontierValue, getCurrentFrontier } from "@/lib/frontier-utils"
import { FrontierCard, FrontierExercise } from "@/types/frontier"

interface FrontierPaperCardProps {
  card: FrontierCard
  onExerciseClick: (exercise: FrontierExercise) => void
  onAddExercise: () => void
  onOpenCardMenu: () => void
  onSwipe: (direction: "previous" | "next") => void
}

export function FrontierPaperCard({
  card,
  onExerciseClick,
  onAddExercise,
  onOpenCardMenu,
  onSwipe,
}: FrontierPaperCardProps) {
  const touchStartXRef = useRef<number | null>(null)

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const distance = event.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null
    if (Math.abs(distance) < 55) return
    event.preventDefault()
    onSwipe(distance > 0 ? "previous" : "next")
  }

  return (
    <div className="relative mx-auto w-full max-w-lg px-1 sm:px-4">
      <div className="absolute inset-x-6 top-2 h-full rotate-2 rounded-[26px] border border-slate-300/70 bg-[#f5f0e5] shadow-sm sm:inset-x-9" />
      <div className="absolute inset-x-4 top-1 h-full -rotate-1 rounded-[26px] border border-slate-300/80 bg-[#faf6ed] shadow-sm sm:inset-x-7" />

      <article
        key={card.id}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex min-h-[32rem] max-h-[68vh] touch-pan-y flex-col overflow-hidden rounded-[26px] border border-slate-300 bg-[#fffdf7] shadow-[0_22px_60px_-28px_rgba(15,23,42,0.6)]"
      >
        <div className="border-b-2 border-indigo-300/70 px-5 pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-500">
                Spline Fitness · Frontier Card
              </p>
              <h2 className="mt-1 truncate font-serif text-2xl font-bold text-slate-900">
                {card.name}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenCardMenu}
              className="shrink-0 text-slate-500 hover:bg-indigo-50"
              aria-label={`Edit ${card.name}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {card.exercises.length === 0 ? (
            <button
              type="button"
              onClick={onAddExercise}
              className="flex min-h-56 w-full flex-col items-center justify-center px-8 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-indigo-300 bg-indigo-50 text-indigo-600">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-semibold text-slate-700">Add the first exercise</span>
              <span className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                This card only changes when an exercise moves forward.
              </span>
            </button>
          ) : (
            <ol>
              {[...card.exercises]
                .sort((a, b) => a.order - b.order)
                .map((exercise, index) => (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      onClick={() => onExerciseClick(exercise)}
                      className="group grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-sky-200/80 px-5 py-2.5 text-left transition-colors hover:bg-indigo-50/60 focus-visible:bg-indigo-50 focus-visible:outline-none"
                    >
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="w-5 shrink-0 font-mono text-[10px] text-slate-300">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-800">
                          {exercise.name}
                        </span>
                      </span>
                      <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-950 transition-colors group-hover:text-indigo-700">
                        {formatFrontierValue(exercise.metric, getCurrentFrontier(exercise.changes))}
                      </span>
                    </button>
                  </li>
                ))}
            </ol>
          )}
        </div>

        {card.exercises.length > 0 && (
          <button
            type="button"
            onClick={onAddExercise}
            className="flex min-h-14 items-center justify-center gap-2 border-t border-indigo-200 bg-indigo-50/50 px-5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100/70"
          >
            <Plus className="h-4 w-4" />
            Add exercise
          </button>
        )}
      </article>
    </div>
  )
}
