"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Cloud,
  Plus,
  Smartphone,
  Trash2,
  WalletCards,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDialogFocus } from "@/hooks/use-dialog-focus"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import {
  getFrontierCards,
  saveFrontierCards,
} from "@/lib/storage"
import {
  FrontierCard,
  FrontierChange,
  FrontierEntrySave,
  FrontierExercise,
} from "@/types/frontier"
import { SpreadsheetImportRow } from "@/lib/frontier-import"
import { appendUniqueFrontierChanges } from "@/lib/frontier-marks"
import { updateFrontierExercise } from "@/lib/frontier-exercise"
import {
  setFrontierAttemptToday,
} from "@/lib/frontier-attempts"
import { recordFrontierTimerEffort, undoFrontierTimerEffort } from "@/lib/frontier-effort"
import {
  frontierExerciseIdentity,
  getFrontierExerciseStructure,
  normalizeFrontierCard,
  normalizeFrontierEquipment,
} from "@/lib/frontier-structure"
import { FrontierEntrySheet } from "./frontier-entry-sheet"
import { FrontierImportSheet } from "./frontier-import-sheet"
import { FrontierPaperCard } from "./frontier-paper-card"
import { FrontierTimer } from "./frontier-timer"

interface FrontierWalletProps {
  onBack: () => void
}

type SaveStatus = "idle" | "saving" | "saved" | "error"
const LAST_CARD_KEY = "strength-tracker:frontier-last-card"

function createCard(name: string, order: number): FrontierCard {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    exercises: [],
    order,
    createdAt: now,
    updatedAt: now,
  }
}

export function FrontierWallet({ onBack }: FrontierWalletProps) {
  const { user } = useAuth()
  const [cards, setCards] = useState<FrontierCard[]>([])
  const cardsRef = useRef<FrontierCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [entrySheetOpen, setEntrySheetOpen] = useState(false)
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [locationSheetMode, setLocationSheetMode] = useState<"add" | "edit" | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [timerSession, setTimerSession] = useState<{ cardId: string; exercise: FrontierExercise | null; initialWeight?: number } | null>(null)
  const [timerExpanded, setTimerExpanded] = useState(true)
  const saveVersionRef = useRef(0)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadWallet() {
      setLoading(true)
      setLoadError(false)
      let storedCards: FrontierCard[]
      try {
        storedCards = await getFrontierCards()
      } catch {
        if (!cancelled) {
          setLoadError(true)
          setLoading(false)
        }
        return
      }
      if (cancelled) return

      let nextCards = storedCards.map(normalizeFrontierCard)
      if (nextCards.length === 0) {
        const anywhere = createCard("Anywhere", 0)
        nextCards = [anywhere]
        if (!cancelled) setSaveStatus("saving")
        try {
          await saveFrontierCards(nextCards)
          if (!cancelled) setSaveStatus("saved")
        } catch {
          if (!cancelled) setSaveStatus("error")
        }
      }

      cardsRef.current = nextCards
      setCards(nextCards)
      const lastCardId = window.localStorage.getItem(LAST_CARD_KEY)
      const savedIndex = nextCards.findIndex((card) => card.id === lastCardId)
      setCurrentIndex(savedIndex >= 0 ? savedIndex : 0)
      setLoading(false)
    }

    void loadWallet()
    return () => {
      cancelled = true
    }
  }, [reloadKey, user?.uid])

  const persistCard = useCallback(async (wallet: FrontierCard[]) => {
    const version = ++saveVersionRef.current
    setSaveStatus("saving")
    try {
      await saveFrontierCards(wallet)
      if (saveVersionRef.current === version) setSaveStatus("saved")
      return true
    } catch {
      if (saveVersionRef.current === version) setSaveStatus("error")
      return false
    }
  }, [])

  const currentCard = cards[currentIndex] ?? null
  const equipmentOptions = useMemo(() => {
    const options = new Map<string, string>()
    currentCard?.exercises.forEach((exercise) => {
      const equipment = getFrontierExerciseStructure(exercise).equipment
      if (equipment) options.set(equipment.toLocaleLowerCase(), equipment)
    })
    return [...options.values()]
  }, [currentCard])
  const editingExercise = currentCard?.exercises.find(
    (exercise) => exercise.id === editingExerciseId
  ) ?? null
  const timerExercise = cards.find((card) => card.id === timerSession?.cardId)?.exercises.find(
    (exercise) => exercise.id === timerSession?.exercise?.id
  ) ?? timerSession?.exercise ?? null

  const rememberCard = (card: FrontierCard) => {
    window.localStorage.setItem(LAST_CARD_KEY, card.id)
  }

  const navigate = (direction: "previous" | "next") => {
    if (cards.length < 2) return
    const delta = direction === "next" ? 1 : -1
    const nextIndex = (currentIndex + delta + cards.length) % cards.length
    setCurrentIndex(nextIndex)
    rememberCard(cards[nextIndex])
    setEntrySheetOpen(false)
    setEditingExerciseId(null)
    setImportSheetOpen(false)
    setImportNotice(null)
  }

  const commitCard = (updatedCard: FrontierCard) => {
    const nextCards = cardsRef.current.map((card) => card.id === updatedCard.id ? updatedCard : card)
    cardsRef.current = nextCards
    setCards(nextCards)
    void persistCard(nextCards)
  }

  const handleEntrySave = (entry: FrontierEntrySave) => {
    if (!currentCard) return
    const now = new Date().toISOString()
    const normalizedEquipment = normalizeFrontierEquipment(entry.equipment)
    const equipment = equipmentOptions.find(
      (option) => option.toLocaleLowerCase() === normalizedEquipment.toLocaleLowerCase()
    ) ?? normalizedEquipment

    if (!editingExercise) {
      const changes: FrontierChange[] = entry.value || entry.rawValue
        ? [{
            id: crypto.randomUUID(),
            ...(entry.value ? { value: entry.value } : {}),
            ...(entry.rawValue ? { rawValue: entry.rawValue } : {}),
            recordedAt: now,
            kind: "progress",
          }]
        : []
      const exercise: FrontierExercise = {
        id: crypto.randomUUID(),
        name: entry.name,
        equipment,
        bodyPart: entry.bodyPart,
        metric: entry.metric,
        metricSource: "user",
        changes,
        order: currentCard.exercises.length,
        createdAt: now,
        updatedAt: now,
      }
      commitCard({
        ...currentCard,
        exercises: [...currentCard.exercises, exercise],
        updatedAt: now,
      })
    } else {
      const updatedExercise = updateFrontierExercise(editingExercise, { ...entry, equipment }, now)
      commitCard({
        ...currentCard,
        exercises: currentCard.exercises.map((exercise) =>
          exercise.id === updatedExercise.id ? updatedExercise : exercise
        ),
        updatedAt: now,
      })
    }

    setEntrySheetOpen(false)
    setEditingExerciseId(null)
  }

  const handleSpreadsheetImport = (rows: SpreadsheetImportRow[]) => {
    if (!currentCard) return

    const now = new Date().toISOString()
    const nextExercises = [...currentCard.exercises]
    const exercisesByName = new Map(
      nextExercises.map((exercise) => [frontierExerciseIdentity(exercise), exercise])
    )
    let added = 0
    let appendedRows = 0
    let appendedMarks = 0
    let skipped = 0

    rows.forEach((row) => {
      const rowIdentity = frontierExerciseIdentity(row)
      const existing = exercisesByName.get(rowIdentity)
      const preserveTypedValue = !existing || existing.metric === row.metric
      const changes: FrontierChange[] = row.marks.map((mark) => ({
        id: crypto.randomUUID(),
        ...(preserveTypedValue && mark.value ? { value: mark.value } : {}),
        rawValue: mark.rawValue,
        kind: "import",
      }))

      if (existing) {
        const nextChanges = appendUniqueFrontierChanges(existing.changes, changes)
        const addedMarks = nextChanges.length - existing.changes.length
        if (addedMarks > 0) {
          const updatedExercise: FrontierExercise = {
            ...existing,
            changes: nextChanges,
            updatedAt: now,
          }
          const index = nextExercises.findIndex((exercise) => exercise.id === existing.id)
          nextExercises[index] = updatedExercise
          exercisesByName.set(rowIdentity, updatedExercise)
          appendedRows += 1
          appendedMarks += addedMarks
        } else {
          skipped += 1
        }
        return
      }

      const exercise: FrontierExercise = {
        id: crypto.randomUUID(),
        name: row.name,
        ...(row.equipment ? { equipment: row.equipment } : {}),
        ...(row.bodyPart ? { bodyPart: row.bodyPart } : {}),
        metric: row.metric,
        changes,
        order: nextExercises.length,
        createdAt: now,
        updatedAt: now,
      }
      nextExercises.push(exercise)
      exercisesByName.set(rowIdentity, exercise)
      added += 1
    })

    if (added > 0 || appendedRows > 0) {
      commitCard({
        ...currentCard,
        exercises: nextExercises,
        updatedAt: now,
      })
    }

    const imported = added + appendedRows
    const summary = [
      added > 0 ? `${added} exercise${added === 1 ? "" : "s"} added` : null,
      appendedMarks > 0
        ? `${appendedMarks} mark${appendedMarks === 1 ? "" : "s"} appended to ${appendedRows} existing`
        : null,
      skipped > 0
        ? `${skipped} duplicate or empty existing row${skipped === 1 ? "" : "s"} skipped`
        : null,
    ].filter(Boolean)
    setImportNotice(
      imported > 0 ? summary.join(" · ") : "Nothing new to import"
    )
    setImportSheetOpen(false)
  }

  const handleUndo = () => {
    if (!currentCard || !editingExercise || editingExercise.changes.length < 2) return
    const now = new Date().toISOString()
    const updatedExercise = {
      ...editingExercise,
      changes: editingExercise.changes.slice(0, -1),
      updatedAt: now,
    }
    commitCard({
      ...currentCard,
      exercises: currentCard.exercises.map((exercise) =>
        exercise.id === updatedExercise.id ? updatedExercise : exercise
      ),
      updatedAt: now,
    })
    setEntrySheetOpen(false)
    setEditingExerciseId(null)
  }

  const handleSetAttemptToday = async (cardId: string, exerciseId: string, tried: boolean) => {
    const nextCards = setFrontierAttemptToday(cardsRef.current, cardId, exerciseId, tried)
    cardsRef.current = nextCards
    setCards(nextCards)
    if (!await persistCard(nextCards)) throw new Error("Could not save. Please retry.")
  }

  const handleUndoTimedEffort = async (cardId: string, exerciseId: string, attemptId: string) => {
    const nextCards = undoFrontierTimerEffort(cardsRef.current, cardId, exerciseId, attemptId)
    cardsRef.current = nextCards
    setCards(nextCards)
    if (!await persistCard(nextCards)) throw new Error("Could not save the removal. Please retry.")
  }

  const handleDeleteExercise = () => {
    if (!currentCard || !editingExercise) return
    const nextExercises = currentCard.exercises
      .filter((exercise) => exercise.id !== editingExercise.id)
      .map((exercise, index) => ({ ...exercise, order: index }))
    commitCard({
      ...currentCard,
      exercises: nextExercises,
      updatedAt: new Date().toISOString(),
    })
    setEntrySheetOpen(false)
    setEditingExerciseId(null)
  }

  const handleLocationSave = (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    if (locationSheetMode === "add") {
      const card = createCard(trimmedName, cards.length)
      const nextCards = [...cards, card]
      cardsRef.current = nextCards
      setCards(nextCards)
      setCurrentIndex(nextCards.length - 1)
      rememberCard(card)
      void persistCard(nextCards)
    } else if (currentCard) {
      commitCard({
        ...currentCard,
        name: trimmedName,
        updatedAt: new Date().toISOString(),
      })
    }

    setLocationSheetMode(null)
  }

  const handleDeleteLocation = async () => {
    if (!currentCard || cards.length === 1) return
    if (!window.confirm(`Remove the ${currentCard.name} card and all of its exercises?`)) return

    const nextCards = cards.filter((card) => card.id !== currentCard.id)
    const nextIndex = Math.min(currentIndex, nextCards.length - 1)
    cardsRef.current = nextCards
    setCards(nextCards)
    setCurrentIndex(nextIndex)
    rememberCard(nextCards[nextIndex])
    setLocationSheetMode(null)
    setSaveStatus("saving")
    try {
      await saveFrontierCards(nextCards)
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
        <div className="max-w-sm text-center">
          <WalletCards className="mx-auto h-8 w-8 text-indigo-400" />
          <p className="mt-3 font-semibold text-slate-800">Frontier Cards could not be loaded.</p>
          <p className="mt-1 text-sm text-slate-500">Check your connection and try again.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={onBack}>Back</Button>
            <Button onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !currentCard) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-100">
        <div className="text-center">
          <WalletCards className="mx-auto h-8 w-8 animate-pulse text-indigo-400" />
          <p className="mt-3 text-sm text-slate-500">Opening your wallet…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,_#e0e7ff_0,_#f8fafc_42%,_#e2e8f0_100%)] text-slate-900">
      <header className="border-b border-white/70 bg-white/75 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-slate-600">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-900">Frontier Cards</h1>
            <SaveIndicator status={saveStatus} cloud={Boolean(user)} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocationSheetMode("add")}
            className="-mr-2 text-indigo-700"
          >
            <Plus className="mr-1 h-4 w-4" />
            Card
          </Button>
        </div>
      </header>

      <main className={`mx-auto flex w-full max-w-3xl flex-col px-2 pt-6 sm:px-6 sm:pt-8 ${timerSession ? "pb-28" : "pb-8"}`}>
        <div className="mb-4 flex items-center justify-between px-2 sm:px-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("previous")}
            disabled={cards.length < 2}
            className="rounded-full border-white/80 bg-white/75 shadow-sm"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Pocket wallet
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-600">
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("next")}
            disabled={cards.length < 2}
            className="rounded-full border-white/80 bg-white/75 shadow-sm"
            aria-label="Next card"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <FrontierPaperCard
          key={currentCard.id}
          card={currentCard}
          onSetAttemptToday={(exercise, tried) => handleSetAttemptToday(currentCard.id, exercise.id, tried)}
          onUndoEffort={(exercise, attemptId) => handleUndoTimedEffort(currentCard.id, exercise.id, attemptId)}
          onExerciseClick={(exercise) => {
            setEditingExerciseId(exercise.id)
            setEntrySheetOpen(true)
          }}
          onAddExercise={() => {
            setEditingExerciseId(null)
            setEntrySheetOpen(true)
          }}
          onOpenCardMenu={() => setLocationSheetMode("edit")}
          timerInUse={timerSession !== null}
          onOpenTimer={() => {
            setTimerSession((current) => current ?? { cardId: currentCard.id, exercise: null })
            setTimerExpanded(true)
          }}
          onTimeExercise={(exercise) => {
            setTimerSession((current) => current ?? { cardId: currentCard.id, exercise })
            setTimerExpanded(true)
          }}
          onSwipe={navigate}
        />

        <div className="mt-6 flex min-h-3 items-center justify-center gap-2">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setCurrentIndex(index)
                rememberCard(card)
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-6 bg-indigo-600" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Open ${card.name}`}
            />
          ))}
        </div>

        {importNotice && (
          <p role="status" className="mt-4 text-center text-xs font-medium text-emerald-700">
            {importNotice}
          </p>
        )}

        <p className="mt-3 text-center text-xs text-slate-400">
          Swipe the card to move through your wallet.
        </p>
      </main>

      {timerSession && (
        <FrontierTimer
          key={`${timerSession.cardId}-${timerSession.exercise?.id ?? "stopwatch"}`}
          exercise={timerExercise}
          initialWeight={timerSession.initialWeight}
          choices={cards.flatMap((card) => card.exercises.map((exercise) => ({ cardId: card.id, cardName: card.name, exercise })))}
          onSelectExercise={(cardId, exerciseId) => {
            const exercise = cards.find((card) => card.id === cardId)?.exercises.find((item) => item.id === exerciseId)
            if (exercise) setTimerSession({ cardId, exercise })
          }}
          onRecord={async (attempt, update) => {
            if (!timerSession.exercise) return
            const nextCards = recordFrontierTimerEffort(cardsRef.current, timerSession.cardId, timerSession.exercise.id, attempt, update)
            cardsRef.current = nextCards
            setCards(nextCards)
            if (!await persistCard(nextCards)) throw new Error("Could not save this effort. Please retry.")
          }}
          onUndoEffort={(attemptId) => timerSession.exercise
            ? handleUndoTimedEffort(timerSession.cardId, timerSession.exercise.id, attemptId)
            : Promise.resolve()}
          expanded={timerExpanded}
          onExpand={() => setTimerExpanded(true)}
          onMinimize={() => setTimerExpanded(false)}
          onClose={() => setTimerSession(null)}
        />
      )}

      {entrySheetOpen && (
        <FrontierEntrySheet
          key={editingExerciseId ?? "new"}
          exercise={editingExercise}
          active={!(timerSession && timerExpanded)}
          timerInUse={timerSession !== null && (timerSession.cardId !== currentCard.id || timerSession.exercise?.id !== editingExerciseId)}
          onTime={editingExercise ? (weight) => {
            setTimerSession((current) => current ?? { cardId: currentCard.id, exercise: editingExercise, initialWeight: weight })
            setTimerExpanded(true)
          } : undefined}
          equipmentOptions={equipmentOptions}
          onClose={() => {
            setEntrySheetOpen(false)
            setEditingExerciseId(null)
          }}
          onSave={handleEntrySave}
          onUndo={editingExercise?.changes.length && editingExercise.changes.length > 1 ? handleUndo : undefined}
          onDelete={editingExercise ? handleDeleteExercise : undefined}
        />
      )}

      {locationSheetMode && (
        <LocationSheet
          mode={locationSheetMode}
          initialName={locationSheetMode === "edit" ? currentCard.name : ""}
          canDelete={cards.length > 1}
          onClose={() => setLocationSheetMode(null)}
          onSave={handleLocationSave}
          onDelete={locationSheetMode === "edit" ? handleDeleteLocation : undefined}
          onImport={locationSheetMode === "edit" ? () => {
            setLocationSheetMode(null)
            setImportNotice(null)
            setImportSheetOpen(true)
          } : undefined}
        />
      )}

      {importSheetOpen && (
        <FrontierImportSheet
          card={currentCard}
          onClose={() => setImportSheetOpen(false)}
          onImport={handleSpreadsheetImport}
        />
      )}
    </div>
  )
}

function SaveIndicator({ status, cloud }: { status: SaveStatus; cloud: boolean }) {
  const Icon = cloud ? Cloud : Smartphone
  const text = status === "saving"
    ? "Saving…"
    : status === "error"
      ? "Save failed"
      : cloud
        ? "Saved to cloud"
        : "Saved on this device"

  return (
    <p className={`mt-0.5 flex items-center justify-center gap-1 text-[10px] ${
      status === "error" ? "text-red-500" : "text-slate-400"
    }`}>
      {status === "saved" ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      {text}
    </p>
  )
}

interface LocationSheetProps {
  mode: "add" | "edit"
  initialName: string
  canDelete: boolean
  onClose: () => void
  onSave: (name: string) => void
  onDelete?: () => void
  onImport?: () => void
}

function LocationSheet({
  mode,
  initialName,
  canDelete,
  onClose,
  onSave,
  onDelete,
  onImport,
}: LocationSheetProps) {
  const [name, setName] = useState(initialName)
  const dialogRef = useDialogFocus<HTMLElement>(true, onClose)

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close location editor"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-sheet-title"
        tabIndex={-1}
        className="relative z-10 w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              {mode === "add" ? "Add to wallet" : "Card settings"}
            </p>
            <h2 id="location-sheet-title" className="mt-1 text-xl font-bold text-slate-900">
              {mode === "add" ? "New location card" : "Edit location card"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-5 space-y-2">
          <label htmlFor="frontier-location" className="text-sm font-semibold text-slate-700">
            Location
          </label>
          <Input
            id="frontier-location"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Fenton Gym"
            autoFocus
            className="h-12"
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim()) onSave(name)
            }}
          />
          <p className="text-xs text-slate-400">
            Use “Anywhere” for bodyweight exercises that travel with you.
          </p>
        </div>

        <Button
          size="lg"
          disabled={!name.trim()}
          onClick={() => onSave(name)}
          className="mt-5 h-12 w-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {mode === "add" ? "Add card" : "Save name"}
        </Button>

        {mode === "edit" && onImport && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <Button variant="outline" onClick={onImport} className="w-full text-indigo-700">
              <ClipboardPaste className="h-4 w-4" />
              Paste spreadsheet
            </Button>
          </div>
        )}

        {mode === "edit" && onDelete && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={!canDelete}
              onClick={onDelete}
              className="text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove card
            </Button>
            {!canDelete && (
              <p className="mt-1 text-xs text-slate-400">Your wallet must contain at least one card.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
