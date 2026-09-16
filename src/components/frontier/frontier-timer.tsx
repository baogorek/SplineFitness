"use client"

import { useEffect, useState } from "react"
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Square, Timer, Volume2, VolumeX, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAudio } from "@/hooks/use-audio"
import { useDialogFocus } from "@/hooks/use-dialog-focus"
import { useFrontierTimer } from "@/hooks/use-frontier-timer"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { formatFrontierTimerTime, getFrontierTimerTarget } from "@/lib/frontier-timer"
import { formatDurationInput, formatFrontierChange, getCurrentFrontierChange, parseDuration } from "@/lib/frontier-utils"
import { getFrontierExerciseStructure } from "@/lib/frontier-structure"
import { getFrontierTimerProposal, hasFrontierMarkForEffort, FrontierTimerProposal } from "@/lib/frontier-effort"
import { FrontierAttempt, FrontierExercise } from "@/types/frontier"

interface FrontierTimerProps {
  exercise: FrontierExercise | null
  expanded: boolean
  onExpand: () => void
  onMinimize: () => void
  onClose: () => void
  initialWeight?: number
  choices: { cardId: string; cardName: string; exercise: FrontierExercise }[]
  onSelectExercise: (cardId: string, exerciseId: string) => void
  onRecord: (attempt: FrontierAttempt, update?: { baseline: FrontierExercise; proposal: FrontierTimerProposal }) => Promise<void>
  onUndoEffort: (attemptId: string) => Promise<void>
}

export function FrontierTimer({ exercise, expanded, onExpand, onMinimize, onClose, initialWeight, choices, onSelectExercise, onRecord, onUndoEffort }: FrontierTimerProps) {
  const [targetInput, setTargetInput] = useState(() => formatDurationInput(getFrontierTimerTarget(exercise) ?? undefined))
  const [weightInput, setWeightInput] = useState(() => String(initialWeight ?? (exercise ? getCurrentFrontierChange(exercise.metric, exercise.changes)?.value?.primary : undefined) ?? ""))
  const [baseline, setBaseline] = useState(exercise)
  const [effort, setEffort] = useState<FrontierAttempt | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [updated, setUpdated] = useState(false)
  const [retryAction, setRetryAction] = useState<"record" | "update" | "undo">("record")
  const [undone, setUndone] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audio = useAudio()
  const timer = useFrontierTimer({
    onPrepTick: () => { if (soundEnabled) audio.playCountdownTick() },
    onStart: () => { if (soundEnabled) audio.playCountdownGo() },
    onTarget: () => { if (soundEnabled) audio.playCompleteSound() },
  })
  const running = timer.status === "running"
  const ready = timer.status === "ready"
  const finished = timer.status === "finished"
  const paused = timer.status === "paused"
  const preparing = !ready && !finished && timer.prepRemainingSeconds > 0
  const dismiss = ready || finished ? onClose : onMinimize
  const dialogRef = useDialogFocus<HTMLElement>(expanded, dismiss)
  useWakeLock(running)

  useEffect(() => {
    if (!running || !soundEnabled) return
    audio.startKeepalive()
    return () => audio.stopKeepalive()
  }, [audio, running, soundEnabled])

  const parsedTarget = targetInput.trim() ? parseDuration(targetInput) : null
  const invalidTarget = Boolean(targetInput.trim()) && (parsedTarget === null || parsedTarget <= 0)
  const structure = exercise ? getFrontierExerciseStructure(exercise) : null
  const name = structure?.name ?? "Frontier timer"
  const countingDown = !ready && !finished && !preparing && timer.targetSeconds !== null && !timer.targetReached
  const label = ready
    ? "Ready when you are"
    : finished
      ? "Total time"
      : preparing
        ? "Get ready"
        : countingDown
          ? "Time to target"
          : "Total time"
  const displayTime = preparing
    ? String(timer.prepRemainingSeconds)
    : formatFrontierTimerTime(
        ready ? parsedTarget ?? 0 : countingDown ? timer.remainingSeconds : timer.elapsedSeconds,
        countingDown || ready
      )
  const currentMark = exercise ? getCurrentFrontierChange(exercise.metric, exercise.changes) : null
  const weight = Number(weightInput)
  const invalidWeight = exercise?.metric === "weight-time" && Boolean(weightInput.trim()) && (!Number.isFinite(weight) || weight <= 0)
  const proposal = baseline && effort ? getFrontierTimerProposal(baseline, effort.elapsedSeconds ?? 0, effort.weight) : null
  const linkedMark = exercise && effort && hasFrontierMarkForEffort(exercise, effort.id)
  const resultStatus = saveState === "saving" ? "Saving…"
    : saveState === "error" ? retryAction === "undo" ? "Could not save the removal" : retryAction === "update" ? "Effort recorded · Frontier update not saved" : "Effort could not be saved"
    : undone ? "Effort removed" : updated ? "Effort recorded · Frontier updated" : "Effort recorded · Tried today"

  const saveEffort = async (attempt: FrontierAttempt, updateFrontier = false) => {
    setSaveState("saving")
    setSaveError(null)
    setRetryAction(updateFrontier ? "update" : "record")
    try {
      await onRecord(attempt, updateFrontier && baseline && proposal ? { baseline, proposal } : undefined)
      setSaveState("saved")
      if (updateFrontier) setUpdated(true)
    } catch (error) {
      setSaveState("error")
      setSaveError(error instanceof Error ? error.message : "Could not save this effort. Please retry.")
    }
  }

  const undoEffort = async () => {
    if (!effort) return
    setSaveState("saving")
    setSaveError(null)
    setRetryAction("undo")
    try {
      await onUndoEffort(effort.id)
      setSaveState("saved")
      setUndone(true)
      setUpdated(false)
    } catch (error) {
      setSaveState("error")
      setSaveError(error instanceof Error ? error.message : "Could not save the removal. Please retry.")
    }
  }

  const finishEffort = () => {
    const result = timer.finish()
    if (!result || result.elapsedSeconds <= 0 || !exercise) return
    const attempt: FrontierAttempt = {
      id: crypto.randomUUID(), attemptedAt: new Date().toISOString(), source: "timer",
      elapsedSeconds: result.elapsedSeconds,
      ...(baseline?.metric === "weight-time" && weightInput.trim() ? { weight } : {}),
    }
    setEffort(attempt)
    void saveEffort(attempt)
  }

  if (!expanded) {
    return (
      <div className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-3 text-slate-900 shadow-xl">
        <button type="button" onClick={onExpand} aria-label={`Expand timer for ${name}`} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
          <Timer aria-hidden="true" className={`h-5 w-5 shrink-0 ${running ? "text-indigo-600" : "text-slate-400"}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{name}</span>
            <span className="block text-[11px] text-slate-500">{paused ? "Paused" : label}</span>
          </span>
          <span role="timer" aria-live="off" className="font-mono text-2xl font-bold tabular-nums text-indigo-950">{displayTime}</span>
          <Maximize2 aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <Button size="icon" variant="outline" className="h-12 w-12 shrink-0" onClick={ready || finished ? onExpand : running ? timer.pause : timer.resume} aria-label={ready || finished ? "Open timer" : running ? "Pause timer" : "Resume timer"}>
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={dismiss} />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frontier-timer-title"
        tabIndex={-1}
        className="relative max-h-[95dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-[#fffdf7] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl focus:outline-none sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Frontier timer</p>
            <h2 id="frontier-timer-title" className="mt-1 break-words font-serif text-2xl font-bold">{name}</h2>
            {structure?.equipment && <p className="mt-1 text-xs text-slate-500">{structure.equipment}</p>}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={dismiss} aria-label={ready || finished ? "Close timer" : "Minimize timer"}>
            {ready || finished ? <X className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
          </Button>
        </div>

        {ready && (
          <div className="mt-6 space-y-2">
            {!exercise && (
              <div className="mb-4 space-y-2">
                <label htmlFor="frontier-timer-exercise" className="text-sm font-semibold">Exercise</label>
                <select id="frontier-timer-exercise" className="h-12 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm" value="" onChange={(event) => {
                  if (!event.target.value) return
                  const choice = choices[Number(event.target.value)]
                  if (choice) onSelectExercise(choice.cardId, choice.exercise.id)
                }}>
                  <option value="">Just a stopwatch</option>
                  {choices.map((choice, index) => <option key={`${choice.cardId}-${choice.exercise.id}`} value={index}>{choice.exercise.name} · {choice.cardName}</option>)}
                </select>
                <p className="text-xs text-slate-500">Choose an exercise to record your effort when you finish.</p>
              </div>
            )}
            {exercise?.metric === "weight-time" && (
              <div className="mb-4 space-y-2">
                <label htmlFor="frontier-timer-weight" className="text-sm font-semibold">Weight used (lb) <span className="font-normal text-slate-400">(optional)</span></label>
                <Input id="frontier-timer-weight" inputMode="decimal" value={weightInput} onChange={(event) => setWeightInput(event.target.value)} aria-invalid={invalidWeight} className="h-12 bg-white font-mono" />
                <p className={`text-xs ${invalidWeight ? "text-red-600" : "text-slate-500"}`}>{invalidWeight ? "Enter a weight greater than zero." : "Confirm the weight to receive a frontier suggestion."}</p>
              </div>
            )}
            <label htmlFor="frontier-timer-target" className="text-sm font-semibold">Target time <span className="font-normal text-slate-400">(optional)</span></label>
            <Input
              id="frontier-timer-target"
              value={targetInput}
              onChange={(event) => setTargetInput(event.target.value)}
              placeholder="e.g. 1:30 or 90s"
              aria-invalid={invalidTarget}
              aria-describedby="frontier-timer-target-help"
              autoComplete="off"
              className="h-12 bg-white font-mono text-lg"
            />
            <p id="frontier-timer-target-help" className={`text-xs ${invalidTarget ? "text-red-600" : "text-slate-500"}`}>
              {invalidTarget ? "Enter a time greater than zero, such as 1:30 or 90s." : "Leave blank to use as a stopwatch."}
            </p>
            {exercise && currentMark && (
              <p className="text-xs text-indigo-600">Current mark: {formatFrontierChange(exercise.metric, currentMark)}</p>
            )}
          </div>
        )}

        <div className={`my-6 rounded-2xl border px-3 py-8 text-center ${preparing ? "border-amber-200 bg-amber-50" : "border-indigo-100 bg-white"}`}>
          <p role="status" className={`text-xs font-bold uppercase tracking-[0.15em] ${preparing ? "text-amber-700" : "text-indigo-500"}`}>
            {paused ? "Paused · " : ""}{label}{preparing ? ` · ${timer.prepRemainingSeconds}` : ""}
          </p>
          <p role="timer" aria-live="off" aria-label={label} className={`mt-3 font-mono text-[clamp(2.5rem,12vw,3.75rem)] font-bold leading-none tabular-nums tracking-tight ${preparing ? "text-amber-900" : "text-indigo-950"}`}>
            {displayTime}
          </p>
          <div className="mt-4 min-h-5 text-sm text-slate-500">
            {preparing ? "Get into position. Your time starts after 1." : ready ? "5-second setup countdown before every start" : timer.targetReached ? (
              <span>Target reached · <span className="font-mono tabular-nums">+{formatFrontierTimerTime(timer.overtimeSeconds)}</span> past target</span>
            ) : countingDown ? (
              <span>Total <span className="font-mono tabular-nums">{formatFrontierTimerTime(timer.elapsedSeconds)}</span></span>
            ) : timer.targetSeconds !== null ? (
              <span>Target <span className="font-mono tabular-nums">{formatFrontierTimerTime(timer.targetSeconds)}</span></span>
            ) : "Stopwatch"}
          </div>
          {!ready && !preparing && !finished && timer.targetReached && (
            <p role="status" className="mt-2 text-xs text-indigo-600">{paused ? "Resume to continue timing." : "Total time continues until you finish."}</p>
          )}
        </div>

        {ready ? (
          <>
            <p className="mb-4 text-center text-sm leading-relaxed text-slate-500">Count down to your target, then keep counting total time until you finish.</p>
            <Button className="h-14 w-full bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700" disabled={invalidTarget || invalidWeight} onClick={() => {
              setBaseline(exercise)
              timer.start(parsedTarget)
            }}>
              <Play className="mr-2 h-5 w-5" />Start · 5s to get ready
            </Button>
          </>
        ) : finished ? (
          <>
            {effort && (
              <div className="mb-4 space-y-3">
                <p role="status" className={`text-sm ${saveState === "error" ? "text-red-700" : "text-emerald-700"}`}>{resultStatus}</p>
                {saveError && (
                  <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    <p>{saveError}</p>
                    <Button variant="outline" className="mt-2" onClick={() => void (retryAction === "undo" ? undoEffort() : saveEffort(effort, retryAction === "update"))}>{retryAction === "undo" ? "Retry undo" : "Retry save"}</Button>
                  </div>
                )}
                {proposal && baseline && !updated && !undone && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-sm font-semibold">Update frontier to <span className="break-words font-mono">{formatFrontierChange(baseline.metric, { id: "proposal", kind: "progress", ...proposal })}</span>?</p>
                    <p className="mt-1 text-xs text-slate-600">Suggested time rounded to the nearest 15 seconds.{effort.weight !== undefined && ` Confirm this effort used ${effort.weight} lb.`}</p>
                    <Button className="mt-3 w-full bg-indigo-600 text-white hover:bg-indigo-700" disabled={saveState !== "saved"} onClick={() => void saveEffort(effort, true)}>Update frontier</Button>
                    <p className="mt-2 text-xs text-slate-500">Choose Done to keep only the recorded effort.</p>
                  </div>
                )}
                {!undone && (
                  <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal text-slate-600" disabled={saveState !== "saved"} onClick={() => void undoEffort()}>
                    <RotateCcw aria-hidden="true" className="mr-1.5 h-4 w-4" />{linkedMark ? "Undo effort and frontier mark" : "Undo effort"}
                  </Button>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 bg-white" disabled={saveState === "saving" || saveState === "error"} onClick={() => {
                timer.reset()
                setEffort(null)
                setUpdated(false)
                setUndone(false)
                setSaveState("idle")
                setSaveError(null)
                setTargetInput(formatDurationInput(getFrontierTimerTarget(exercise) ?? undefined))
              }}><RotateCcw className="mr-2 h-4 w-4" />New effort</Button>
              <Button className="h-14 bg-indigo-600 text-white hover:bg-indigo-700" disabled={saveState === "saving"} onClick={onClose}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 bg-white text-base" onClick={running ? timer.pause : timer.resume}>
                {running ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}{running ? "Pause" : "Resume"}
              </Button>
              <Button className="h-14 bg-indigo-600 text-base text-white hover:bg-indigo-700" onClick={preparing ? timer.reset : finishEffort}>
                {preparing ? <X className="mr-2 h-5 w-5" /> : <Square className="mr-2 h-5 w-5" />}{preparing ? "Cancel" : "Finish"}
              </Button>
            </div>
            {paused && <Button variant="ghost" className="mt-2 w-full text-slate-500" onClick={timer.reset}><RotateCcw className="mr-2 h-4 w-4" />Reset timer</Button>}
          </>
        )}

        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" aria-pressed={soundEnabled} onClick={() => {
            if (!soundEnabled) audio.playCountdownTick()
            setSoundEnabled((enabled) => !enabled)
          }} className="text-xs text-slate-500">
            {soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}Sound {soundEnabled ? "on" : "off"}
          </Button>
        </div>
      </section>
    </div>
  )
}
