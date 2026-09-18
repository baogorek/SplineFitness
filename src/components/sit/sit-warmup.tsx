"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { useAudio } from "@/hooks/use-audio"
import { SitWarmupProgress } from "@/types/workout"
import {
  advanceSitWarmup, BUILD_UP_DISTANCE_METERS, canAdvanceSitWarmup, createSitWarmup,
  formatWarmupTime, getWarmupElapsed, pauseSitWarmup, repeatSitWarmup,
  SIT_WARMUP_STEPS, startSitWarmupStep, tickSitWarmup,
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
  const lastCountdown = useRef(0)
  const announcedRecovery = useRef(false)
  const lastPublish = useRef(-1)
  useEffect(() => { callbacks.current = { onProgress, onClockRunning, onComplete } }, [onProgress, onClockRunning, onComplete])

  const publish = useCallback((next: SitWarmupProgress, now: number) => {
    engine.current = next
    setState(next)
    setNowMs(now)
    callbacks.current.onProgress({ ...next, elapsedMs: getWarmupElapsed(next, now, speedMultiplier), startedAtMs: next.status === "active" ? now : null })
  }, [speedMultiplier])

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const previous = engine.current
      const step = SIT_WARMUP_STEPS[previous.stepIndex]
      // Never start a run out of sight or replay a delayed countdown on return.
      if (previous.status === "countdown" && document.visibilityState !== "visible") {
        publish(pauseSitWarmup(previous, now, speedMultiplier), now)
        return
      }
      const next = tickSitWarmup(previous, now, speedMultiplier)
      if (previous.status === "countdown" && next.status === "active") {
        audio.playCountdownGo()
        audio.speak(next.elapsedMs > 0 ? `Go. Resume ${step.title}.` : step.startCue)
      } else if (next.status === "countdown") {
        const remaining = Math.ceil(Math.max(0, (next.countdownEndsAtMs! - now) * speedMultiplier) / 1000)
        if (remaining !== lastCountdown.current) {
          lastCountdown.current = remaining
          audio.playCountdownTick()
        }
      } else if (next.status === "done" && previous.status !== "done") {
        audio.speak(step.finishCue)
      } else if (step.kind === "recovery" && next.status === "active"
        && getWarmupElapsed(next, now, speedMultiplier) >= step.seconds * 1000 && !announcedRecovery.current) {
        // A crossed threshold fires once even if a browser tick arrives late.
        announcedRecovery.current = true
        audio.speak(step.finishCue)
      }
      const second = Math.floor(now * speedMultiplier / 1000)
      if (next !== previous || ((next.status === "active" || next.status === "countdown") && second !== lastPublish.current)) {
        lastPublish.current = second
        publish(next, now)
      }
    }
    const interval = window.setInterval(tick, 100)
    const visibility = () => {
      if (engine.current.status === "countdown") {
        window.speechSynthesis?.cancel()
        publish(pauseSitWarmup(engine.current, Date.now(), speedMultiplier), Date.now())
      } else tick()
    }
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("pageshow", tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("pageshow", tick)
      window.speechSynthesis?.cancel()
    }
  }, [audio, publish, speedMultiplier])

  const step = SIT_WARMUP_STEPS[state.stepIndex]
  const nextStep = SIT_WARMUP_STEPS[state.stepIndex + 1]
  const elapsedSeconds = Math.floor(getWarmupElapsed(state, nowMs, speedMultiplier) / 1000)
  const remainingSeconds = Math.max(0, step.seconds - elapsedSeconds)
  const canAdvance = canAdvanceSitWarmup(state, nowMs, speedMultiplier)
  const isLast = state.stepIndex === SIT_WARMUP_STEPS.length - 1
  const start = () => {
    window.speechSynthesis?.cancel()
    lastCountdown.current = 5
    audio.playCountdownTick()
    publish(startSitWarmupStep(engine.current, Date.now(), speedMultiplier), Date.now())
    callbacks.current.onClockRunning(true)
  }
  const pause = () => {
    window.speechSynthesis?.cancel()
    publish(pauseSitWarmup(engine.current, Date.now(), speedMultiplier), Date.now())
    callbacks.current.onClockRunning(false)
  }
  const move = (repeat = false) => {
    const now = Date.now()
    if (!canAdvanceSitWarmup(engine.current, now, speedMultiplier)) return
    window.speechSynthesis?.cancel()
    if (isLast && !repeat) { callbacks.current.onComplete(); return }
    const next = repeat ? repeatSitWarmup(engine.current, now, speedMultiplier) : advanceSitWarmup(engine.current, now, speedMultiplier)
    announcedRecovery.current = false
    publish(next, now)
    if (SIT_WARMUP_STEPS[next.stepIndex].kind === "recovery") audio.speak("Run finished. Walk back and recover.")
    else audio.speak(`Next: ${SIT_WARMUP_STEPS[next.stepIndex].title}. Start when ready.`)
  }

  return (
    <section aria-label="Guided sprint warmup" className="mx-auto flex w-full max-w-md flex-col gap-5 py-6">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>{step.section}</span><span>Step {state.stepIndex + 1} of {SIT_WARMUP_STEPS.length}</span>
      </div>
      <div className="space-y-2 text-center" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wider text-green-700">
          {state.status === "ready" ? "Get set" : state.status === "countdown" ? "Get ready · wait for Go" : state.status === "paused" ? "Paused" : state.status === "done" ? "Step complete" : "Now"}
        </p>
        <h2 className="text-2xl font-bold">{step.title}</h2>
        {step.kind === "run" && <p className="text-lg font-semibold text-green-700">About {BUILD_UP_DISTANCE_METERS} m · roughly {step.effort}% speed</p>}
      </div>

      <p className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-relaxed text-green-950">{step.instruction}</p>

      <div className="text-center">
        {state.status === "countdown" ? (
          <p className="font-mono text-6xl font-bold tabular-nums" aria-label="Start countdown">{Math.ceil(Math.max(0, (state.countdownEndsAtMs! - nowMs) * speedMultiplier) / 1000)}</p>
        ) : step.kind === "run" ? (
          <p className="text-sm text-muted-foreground">{state.status === "active" ? "Run now. Slow down, then tap Finished run." : "Start when your route is clear and you feel ready."}</p>
        ) : (
          <>
            <p className="font-mono text-5xl font-bold tabular-nums" aria-label={step.kind === "recovery" ? "Recovery elapsed" : "Time remaining"}>{formatWarmupTime(step.kind === "recovery" ? elapsedSeconds : remainingSeconds)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{step.kind === "recovery" ? `Recovery guide: ${formatWarmupTime(step.seconds)} · take longer if needed` : state.status === "ready" ? "Timer starts on Go" : "Time remaining"}</p>
          </>
        )}
      </div>

      <div className="space-y-2">
        {(state.status === "ready" || state.status === "paused") && <Button className="h-14 w-full bg-green-600 text-base text-white hover:bg-green-700" onClick={start}>{state.status === "paused" ? "Resume" : "Start"} · 5-second countdown</Button>}
        {canAdvance && <Button className="h-14 w-full bg-green-600 text-base text-white hover:bg-green-700" onClick={() => move()}>{step.kind === "run" ? "Finished run" : isLast ? "Ready for sprint setup" : step.kind === "recovery" ? "Ready for next build-up" : "Continue"}</Button>}
        {state.status === "countdown" && <Button variant="outline" className="h-12 w-full" onClick={pause}>Cancel countdown</Button>}
        {state.status === "active" && <Button variant="outline" className="h-12 w-full" onClick={pause}>Pause</Button>}
        {canAdvance && step.kind !== "run" && <Button variant="outline" className="h-12 w-full" onClick={() => move(true)}>{step.kind === "recovery" ? `Repeat ${step.effort}% build-up` : "Repeat this movement"}</Button>}
      </div>

      <div className="rounded-xl bg-muted/50 p-3 text-sm">
        <span className="font-semibold">Next: </span>{nextStep ? `${nextStep.title}${nextStep.effort && nextStep.kind === "run" ? ` · ${nextStep.effort}%` : ""}` : "Sprint 1 setup"}
        <p className="mt-1 text-xs text-muted-foreground">{step.kind === "run" ? "Recovery starts when you finish this run." : "You choose when to continue."}</p>
      </div>
      <Button variant="ghost" className="text-muted-foreground" onClick={onEndWorkout}>End workout</Button>
    </section>
  )
}
