"use client"

import { ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDialogFocus } from "@/hooks/use-dialog-focus"
import { formatFrontierLastTried, getLeastRecentlyTried } from "@/lib/frontier-attempts"
import { getFrontierExerciseStructure } from "@/lib/frontier-structure"
import { FrontierCard } from "@/types/frontier"

export function FrontierRecency({ cards, onClose, onSelect }: {
  cards: FrontierCard[]
  onClose: () => void
  onSelect: (cardId: string, exerciseId: string) => void
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onClose)
  const entries = getLeastRecentlyTried(cards)
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Close least recently tried" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="frontier-recency-title" tabIndex={-1} className="relative flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-white p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl focus:outline-none sm:max-w-lg sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="frontier-recency-title" className="text-xl font-bold">Least recently tried</h2>
            <p className="mt-1 text-sm text-slate-500">Across all cards. No recorded attempts first, then the longest ago.</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></Button>
        </div>
        <ol className="min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100">
          {entries.map(({ card, exercise, lastTried }) => (
            <li key={`${card.id}-${exercise.id}`}>
              <button type="button" className="flex min-h-20 w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400" onClick={() => onSelect(card.id, exercise.id)}>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold">{getFrontierExerciseStructure(exercise).name}</span>
                  <span className="mt-0.5 block break-words text-xs text-slate-500">{card.name}</span>
                  <span className="mt-1 block text-xs font-medium text-indigo-700">{formatFrontierLastTried(lastTried)}</span>
                </span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ol>
        {entries.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Add an exercise to a card to see it here.</p>}
      </section>
    </div>
  )
}
