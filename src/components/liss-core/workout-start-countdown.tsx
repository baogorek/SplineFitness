"use client"

import { useEffect, useRef } from "react"
import { ArrowLeft, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudio } from "@/hooks/use-audio"
import { useDialogFocus } from "@/hooks/use-dialog-focus"
import { useSequenceTimer } from "@/hooks/use-sequence-timer"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { LissCoreStep } from "@/types/workout"

const COUNTDOWN_STEPS: LissCoreStep[] = [{
  id: "start-countdown",
  kind: "reset",
  label: "Get ready",
  durationSeconds: 5,
}]

export function WorkoutStartCountdown({
  firstStep,
  audio,
  onStart,
  onCancel,
}: {
  firstStep: LissCoreStep
  audio: ReturnType<typeof useAudio>
  onStart: () => void
  onCancel: () => void
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true, onCancel)
  const initializedRef = useRef(false)
  const lastTickRef = useRef(5)
  const timer = useSequenceTimer(COUNTDOWN_STEPS, { onComplete: onStart })
  const startTimer = timer.start

  useWakeLock(true)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    startTimer()
  }, [startTimer])

  useEffect(() => {
    if (!timer.isRunning || timer.remainingSeconds <= 0 || timer.remainingSeconds === lastTickRef.current) return
    lastTickRef.current = timer.remainingSeconds
    audio.playCountdownTick()
  }, [audio, timer.isRunning, timer.remainingSeconds])

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="liss-countdown-title" tabIndex={-1} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-white">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col p-4">
        <Button variant="ghost" className="self-start text-slate-300 hover:bg-white/10 hover:text-white" onClick={onCancel}>
          <ArrowLeft /> Back to setup
        </Button>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-amber-300">Get ready</p>
          <h1 id="liss-countdown-title" className="mt-3 text-3xl font-bold">{firstStep.label}</h1>
          {firstStep.substep && <p className="mt-2 text-lg font-semibold text-violet-300">{firstStep.substep}</p>}
          <p className="mt-8 text-sm uppercase tracking-wider text-slate-400">{timer.isRunning ? "Starting in" : "Countdown paused"}</p>
          <div role="timer" aria-label="Seconds until workout starts" className="mt-2 font-mono text-8xl font-black tabular-nums text-amber-300">
            {timer.remainingSeconds}
          </div>
          <Button className="mt-8 h-16 w-full max-w-md bg-violet-600 text-lg hover:bg-violet-500" onClick={timer.isRunning ? timer.pause : timer.resume}>
            {timer.isRunning ? <><Pause className="fill-current" /> Pause countdown</> : <><Play className="fill-current" /> Resume countdown</>}
          </Button>
          <p className="mt-4 max-w-sm text-sm text-slate-400">Need more time to get ready? Pause here. Your workout clock starts after the countdown.</p>
        </div>
      </div>
    </div>
  )
}
