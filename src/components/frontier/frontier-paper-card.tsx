"use client"

import { useMemo, useRef, useState } from "react"
import {
  Accessibility,
  ArrowRight,
  Cable,
  ChevronDown,
  Columns3,
  Dumbbell,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFrontierChange, getCurrentFrontierChange } from "@/lib/frontier-utils"
import { getFrontierExerciseStructure } from "@/lib/frontier-structure"
import { FrontierBodyPart, FrontierCard, FrontierExercise } from "@/types/frontier"

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
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null)
  const [collapsedEquipment, setCollapsedEquipment] = useState<Set<string>>(new Set())
  const equipmentGroups = useMemo(() => groupExercises(card.exercises), [card.exercises])

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
    <div className="relative mx-auto w-full max-w-xl px-0 sm:px-4">
      <div className="absolute inset-x-6 top-2 h-full rotate-2 rounded-[26px] border border-slate-300/70 bg-[#f5f0e5] shadow-sm sm:inset-x-9" />
      <div className="absolute inset-x-4 top-1 h-full -rotate-1 rounded-[26px] border border-slate-300/80 bg-[#faf6ed] shadow-sm sm:inset-x-7" />

      <article
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex min-h-[32rem] max-h-[72vh] touch-pan-y flex-col overflow-hidden rounded-[26px] border border-slate-300 bg-[#fffdf7] shadow-[0_22px_60px_-28px_rgba(15,23,42,0.6)] sm:max-h-[68vh]"
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
            <div>
              {equipmentGroups.map((equipmentGroup, equipmentIndex) => {
                const collapsed = collapsedEquipment.has(equipmentGroup.name)
                const equipmentId = `frontier-equipment-${toDomId(equipmentGroup.name)}-${equipmentIndex}`

                return (
                  <section key={equipmentGroup.name} className="border-b border-indigo-200/80 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCollapsedEquipment((current) => {
                          const next = new Set(current)
                          if (next.has(equipmentGroup.name)) next.delete(equipmentGroup.name)
                          else next.add(equipmentGroup.name)
                          return next
                        })
                      }}
                      aria-expanded={!collapsed}
                      aria-controls={equipmentId}
                      aria-label={`${equipmentGroup.name}, ${equipmentGroup.exerciseCount} exercise${equipmentGroup.exerciseCount === 1 ? "" : "s"}`}
                      className="flex w-full items-center gap-2 bg-indigo-50/70 px-3 py-2 text-left text-indigo-950 transition-colors hover:bg-indigo-100/70 sm:px-5"
                    >
                      <EquipmentIcon name={equipmentGroup.name} />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.12em]">
                        {equipmentGroup.name}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-400">
                        {equipmentGroup.exerciseCount}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 shrink-0 text-indigo-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
                      />
                    </button>

                    {!collapsed && (
                      <div id={equipmentId}>
                        {equipmentGroup.bodyPartGroups.map((bodyPartGroup) => (
                          <section key={bodyPartGroup.name}>
                            <div className="flex items-center gap-2 px-3 pb-1 pt-2.5 sm:px-5">
                              <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                {bodyPartGroup.name}
                              </p>
                              <span className="h-px flex-1 bg-slate-200/80" />
                            </div>

                            <ol>
                              {bodyPartGroup.exercises.map(({ exercise, displayName }) => {
                                const expanded = expandedExerciseId === exercise.id
                                const historyId = `frontier-history-${exercise.id}`

                                return (
                                  <li key={exercise.id} className="border-b border-sky-200/80">
                      <button
                        type="button"
                        onClick={() => setExpandedExerciseId(expanded ? null : exercise.id)}
                        aria-expanded={expanded}
                        aria-controls={historyId}
                        className="group grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-indigo-50/60 focus-visible:bg-indigo-50 focus-visible:outline-none sm:px-5"
                      >
                        <span className="min-w-0 break-words text-sm font-semibold leading-snug text-slate-800">
                          {displayName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="whitespace-nowrap font-mono text-sm font-bold text-indigo-950 transition-colors group-hover:text-indigo-700">
                            {formatFrontierChange(exercise.metric, getCurrentFrontierChange(exercise.changes))}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                          />
                        </span>
                      </button>

                      {expanded && (
                        <div id={historyId} className="bg-indigo-50/45 px-3 pb-3.5 pt-1 sm:px-5">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              History{exercise.changes.length > 0 ? ` · ${exercise.changes.length}` : ""}
                            </p>
                            <button
                              type="button"
                              onClick={() => onExerciseClick(exercise)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                              {exercise.changes.length > 0 ? "Add next mark" : "Add first mark"}
                            </button>
                          </div>

                          {exercise.changes.length > 0 ? (
                            <div
                              className="touch-pan-x overflow-x-auto pb-1 [scrollbar-width:thin]"
                              onTouchStart={(event) => event.stopPropagation()}
                              onTouchEnd={(event) => event.stopPropagation()}
                            >
                              <ol
                                aria-label={`${exercise.name} history, oldest to newest`}
                                className="flex min-w-max items-center"
                              >
                                {exercise.changes.map((change, changeIndex) => {
                                  const current = changeIndex === exercise.changes.length - 1
                                  return (
                                    <li key={change.id} className="flex items-center">
                                      {changeIndex > 0 && (
                                        <ArrowRight aria-hidden="true" className="mx-1.5 h-3 w-3 text-slate-300" />
                                      )}
                                      <span
                                        className={`rounded-md border px-2 py-1 font-mono text-xs font-semibold ${
                                          current
                                            ? "border-indigo-300 bg-white text-indigo-950 shadow-sm"
                                            : "border-slate-200 bg-white/70 text-slate-500"
                                        }`}
                                      >
                                        {formatFrontierChange(exercise.metric, change)}
                                        {current && <span className="sr-only"> (current)</span>}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ol>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No marks recorded yet.</p>
                          )}
                        </div>
                      )}
                                  </li>
                                )
                              })}
                            </ol>
                          </section>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
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

interface ExerciseDisplay {
  exercise: FrontierExercise
  displayName: string
}

interface BodyPartGroup {
  name: FrontierBodyPart | "Uncategorized"
  exercises: ExerciseDisplay[]
}

interface EquipmentGroup {
  name: string
  bodyPartGroups: BodyPartGroup[]
  exerciseCount: number
}

function groupExercises(exercises: FrontierExercise[]): EquipmentGroup[] {
  const groups = new Map<string, EquipmentGroup>()

  Array.from(exercises)
    .sort((a, b) => a.order - b.order)
    .forEach((exercise) => {
      const structure = getFrontierExerciseStructure(exercise)
      const equipmentName = structure.equipment ?? "Other equipment"
      const bodyPartName = structure.bodyPart ?? "Uncategorized"
      const equipmentKey = equipmentName.toLocaleLowerCase()
      let equipmentGroup = groups.get(equipmentKey)
      if (!equipmentGroup) {
        equipmentGroup = { name: equipmentName, bodyPartGroups: [], exerciseCount: 0 }
        groups.set(equipmentKey, equipmentGroup)
      }

      let bodyPartGroup = equipmentGroup.bodyPartGroups.find(
        (candidate) => candidate.name === bodyPartName
      )
      if (!bodyPartGroup) {
        bodyPartGroup = { name: bodyPartName, exercises: [] }
        equipmentGroup.bodyPartGroups.push(bodyPartGroup)
      }

      bodyPartGroup.exercises.push({ exercise, displayName: structure.name })
      equipmentGroup.exerciseCount += 1
    })

  return [...groups.values()]
}

function EquipmentIcon({ name }: { name: string }) {
  const normalized = name.toLocaleLowerCase()
  const Icon = normalized.includes("bodyweight")
    ? Accessibility
    : normalized.includes("cable")
      ? Cable
      : normalized.includes("rack")
        ? Columns3
        : Dumbbell

  return <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-500" />
}

function toDomId(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}
