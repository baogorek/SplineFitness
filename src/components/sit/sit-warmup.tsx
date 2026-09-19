"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { useAudio } from "@/hooks/use-audio"
import { SitWarmupProgress } from "@/types/workout"
import {
  createSitWarmup, finishSitWarmupSetup, formatWarmupTime, getWarmupElapsed,
  getWarmupSetupCue, pauseSitWarmup, repeatSitWarmup, SIT_WARMUP_STEPS,
  startSitWarmupStep, tickSitWarmup, WARMUP_COUNTDOWN_SECONDS,
} from "@/lib/sit-warmup"

interface SitWarmupProps {
  audio: ReturnType<typeof useAudio>
  initialProgress: SitWarmupProgress | null
  speedMultiplier: number
  onProgress: (progress: SitWarmupProgress) => void
  onClockRunning: (running: boolean) => void
  onComplete: () => void
  onEndWorkout: () => void
}

export function SitWarmup({ audio, initialProgress, speedMultiplier, onProgress, onClockRunning, onComplete, onEndWorkout }: SitWarmupProps) {
  const [state, setState] = useState(() => initialProgress ?? createSitWarmup())
  const engine = useRef(state)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const callbacks = useRef({ onProgress, onClockRunning, onComplete })
  const lastCountdown = useRef(WARMUP_COUNTDOWN_SECONDS)
  const lastDisplay = useRef("")
  const speechGeneration = useRef(0)
  useEffect(() => { callbacks.current = { onProgress, onClockRunning, onComplete } }, [onProgress, onClockRunning, onComplete])

  const publish = useCallback((next: SitWarmupProgress, now: number) => {
    engine.current = next
    setState(next)
    setNowMs(now)
    callbacks.current.onProgress({ ...next, elapsedMs: getWarmupElapsed(next, now, speedMultiplier), startedAtMs: next.status === "active" ? now : null })
  }, [speedMultiplier])

  const enter = useCallback((next: SitWarmupProgress, now: number) => {
    const generation = ++speechGeneration.current
    window.speechSynthesis?.cancel()
    publish(next, now)
    const step = SIT_WARMUP_STEPS[next.stepIndex]
    if (next.status === "setup") {
      audio.speak(getWarmupSetupCue(next), () => {
        // Canceled speech from a previous step/pause cannot start a new countdown.
        if (generation !== speechGeneration.current || engine.current !== next) return
        const finishedAt = Date.now()
        publish(finishSitWarmupSetup(next, finishedAt, speedMultiplier), finishedAt)
        lastCountdown.current = WARMUP_COUNTDOWN_SECONDS
        audio.playCountdownTick()
      })
    } else if (next.status === "countdown") {
      lastCountdown.current = WARMUP_COUNTDOWN_SECONDS
      audio.playCountdownTick()
    } else if (next.status === "active") {
      if (step.kind === "recovery") {
        audio.speak(next.elapsedMs > 0 ? "Continue walking and recovering." : step.startCue)
      } else {
        audio.playCountdownGo()
        audio.speak(next.elapsedMs > 0 ? `Go. Resume ${step.title.toLowerCase()}.` : step.startCue)
      }
    } else if (next.status === "done") {
      audio.speak("Warmup complete. Keep walking until you feel warm and ready. Press Ready when you want to sprint.")
      callbacks.current.onComplete()
    }
  }, [audio, publish, speedMultiplier])

  useEffect(() => {
    if (engine.current.status === "ready") enter(startSitWarmupStep(engine.current, Date.now(), speedMultiplier), Date.now())
    else if (engine.current.status === "setup") enter(engine.current, Date.now())

    const tick = () => {
      const now = Date.now()
      const previous = engine.current
      // Let a slower voice finish before counting down. Retain a bounded escape
      // if the browser gets stuck reporting that speech is playing forever.
      const waitingForSpeech = previous.status === "setup" && window.speechSynthesis?.speaking
        && now < (previous.setupEndsAtMs ?? now) + 30000
      const next = waitingForSpeech ? previous : tickSitWarmup(previous, now, speedMultiplier)
      if (next !== previous) {
        enter(next, now)
        return
      }
      const countdown = next.status === "countdown" ? Math.ceil(Math.max(0, (next.countdownEndsAtMs! - now) * speedMultiplier) / 1000) : null
      if (countdown !== null && countdown !== lastCountdown.current && countdown > 0) {
        lastCountdown.current = countdown
        audio.playCountdownTick()
        if (countdown <= 3) audio.speak(String(countdown))
      }
      const display = `${next.stepIndex}/${next.status}/${countdown ?? Math.floor(getWarmupElapsed(next, now, speedMultiplier) / 1000)}`
      if (display !== lastDisplay.current) {
        lastDisplay.current = display
        publish(next, now)
      }
    }
    const interval = window.setInterval(tick, 100)
    // A delayed callback crosses only one boundary, with the next Go delivered now.
    document.addEventListener("visibilitychange", tick)
    window.addEventListener("pageshow", tick)
    return () => {
      speechGeneration.current += 1
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", tick)
      window.removeEventListener("pageshow", tick)
      if (engine.current.status !== "done") window.speechSynthesis?.cancel()
    }
  }, [audio, enter, publish, speedMultiplier])

  const step = SIT_WARMUP_STEPS[state.stepIndex]
  const nextStep = SIT_WARMUP_STEPS[state.repeatRun ? state.stepIndex - 1 : state.stepIndex + 1]
  const remainingSeconds = Math.max(0, step.seconds - getWarmupElapsed(state, nowMs, speedMultiplier) / 1000)
  const paused = state.status === "paused"
  const pause = () => {
    speechGeneration.current += 1
    window.speechSynthesis?.cancel()
    publish(pauseSitWarmup(engine.current, Date.now(), speedMultiplier), Date.now())
    callbacks.current.onClockRunning(false)
  }
  const resume = () => {
    const now = Date.now()
    audio.playCountdownTick()
    callbacks.current.onClockRunning(true)
    enter(startSitWarmupStep(engine.current, now, speedMultiplier), now)
  }

  return (
    <section aria-label="Guided sprint warmup" className="mx-auto flex w-full max-w-md flex-col gap-6 py-6">
      <div className="space-y-3 text-center" aria-live="polite">
        <p className="text-lg font-bold uppercase tracking-wide text-green-700">
          {paused ? "Paused" : state.status === "ready" || state.status === "setup" || state.status === "countdown" ? "Get ready" : step.kind === "recovery" ? "Recover" : "Go"}
        </p>
        <h2 className="text-3xl font-bold leading-tight">{step.title}</h2>
        {step.kind === "run" && <p className="text-2xl font-semibold text-green-700">{step.intensity} · {step.seconds} seconds</p>}
      </div>

      <p className="rounded-xl bg-green-50 p-4 text-center text-2xl font-medium leading-snug text-green-950">{step.instruction}</p>

      <div className="space-y-2 text-center">
        {state.status === "ready" || state.status === "setup" ? (
          <p className="py-4 text-2xl font-medium">Listen and get set.<br />Countdown follows.</p>
        ) : state.status === "countdown" ? (
          <p className="font-mono text-8xl font-bold tabular-nums" aria-label="Start countdown">{Math.ceil(Math.max(0, (state.countdownEndsAtMs! - nowMs) * speedMultiplier) / 1000)}</p>
        ) : (
          <>
            <p className="font-mono text-7xl font-bold tabular-nums" aria-label="Time remaining">{formatWarmupTime(remainingSeconds)}</p>
            <p className="text-lg text-muted-foreground">{step.kind === "recovery" ? "Recovery remaining" : "Time remaining"}</p>
          </>
        )}
      </div>

      <Button className="h-16 w-full gap-3 bg-green-600 text-2xl text-white hover:bg-green-700" onClick={paused ? resume : pause}>
        {paused ? <Play className="size-6" /> : <Pause className="size-6" />}{paused ? "Resume" : "Pause"}
      </Button>
      {paused && step.kind === "recovery" && (
        <Button variant="outline" aria-pressed={state.repeatRun === true} className="h-auto min-h-14 w-full whitespace-normal px-3 py-3 text-lg" onClick={() => publish(repeatSitWarmup(engine.current), Date.now())}>
          {state.repeatRun ? "Repeat queued · undo" : "Repeat this build-up after recovery"}
        </Button>
      )}
      <p className="text-center text-xl text-muted-foreground">
        Next: {nextStep ? `${nextStep.title}${nextStep.kind === "run" ? ` · ${nextStep.intensity}` : ""}` : "Sprint setup"}
      </p>
      <Button variant="ghost" className="h-12 text-base text-muted-foreground" onClick={onEndWorkout}>End workout</Button>
    </section>
  )
}
