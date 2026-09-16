"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  createFrontierTimer,
  finishFrontierTimer,
  FrontierTimerState,
  getFrontierTimerSnapshot,
  pauseFrontierTimer,
  resumeFrontierTimer,
  startFrontierTimer,
} from "@/lib/frontier-timer"

interface FrontierTimerCues {
  onPrepTick: () => void
  onStart: () => void
  onTarget: () => void
}

export function useFrontierTimer(cues: FrontierTimerCues) {
  const [state, setState] = useState(createFrontierTimer)
  const stateRef = useRef(state)
  const [nowMs, setNowMs] = useState(0)
  const cuesRef = useRef(cues)
  const previousRef = useRef(getFrontierTimerSnapshot(state, 0))

  useEffect(() => { cuesRef.current = cues }, [cues])

  const update = useCallback((next: FrontierTimerState, now: number) => {
    stateRef.current = next
    previousRef.current = getFrontierTimerSnapshot(next, now)
    setState(next)
    setNowMs(now)
  }, [])

  useEffect(() => {
    if (state.status !== "running") return

    const tick = () => {
      const now = Date.now()
      const next = getFrontierTimerSnapshot(stateRef.current, now)
      const previous = previousRef.current
      // Reconcile from timestamps after a sleeping/backgrounded tab; never replay missed cues.
      if (next.targetReached && !previous.targetReached) {
        cuesRef.current.onTarget()
      } else if (next.prepRemainingSeconds === 0 && previous.prepRemainingSeconds > 0) {
        cuesRef.current.onStart()
      } else if (next.prepRemainingSeconds > 0 && next.prepRemainingSeconds < previous.prepRemainingSeconds) {
        cuesRef.current.onPrepTick()
      }
      previousRef.current = next
      setNowMs(now)
    }
    const interval = window.setInterval(tick, 50)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pageshow", tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pageshow", tick)
    }
  }, [state.status])

  const start = useCallback((targetSeconds: number | null) => {
    const now = Date.now()
    update(startFrontierTimer(targetSeconds, now), now)
    cuesRef.current.onPrepTick()
  }, [update])

  const pause = useCallback(() => {
    const now = Date.now()
    update(pauseFrontierTimer(stateRef.current, now), now)
  }, [update])

  const resume = useCallback(() => {
    const now = Date.now()
    update(resumeFrontierTimer(stateRef.current, now), now)
  }, [update])

  const finish = useCallback(() => {
    const now = Date.now()
    const next = finishFrontierTimer(stateRef.current, now)
    if (next === stateRef.current) return null
    update(next, now)
    return getFrontierTimerSnapshot(next, now)
  }, [update])

  const reset = useCallback(() => update(createFrontierTimer(), Date.now()), [update])

  return { ...state, ...getFrontierTimerSnapshot(state, nowMs), start, pause, resume, finish, reset }
}
