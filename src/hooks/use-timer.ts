"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

export interface UseTimerOptions {
  targetSeconds?: number
  onMinuteMark?: (minute: number) => void
  onComplete?: (totalSeconds: number) => void
  onTick?: (remainingSeconds: number) => void
  countUp?: boolean
  speedMultiplier?: number
}

export function useTimer(options: UseTimerOptions = {}) {
  const { targetSeconds, onMinuteMark, onComplete, onTick, countUp = false, speedMultiplier = 1 } = options

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMinuteRef = useRef(0)
  const onMinuteMarkRef = useRef(onMinuteMark)
  const onCompleteRef = useRef(onComplete)
  const onTickRef = useRef(onTick)

  const startTimeRef = useRef<number>(0)
  const pausedAccumulatorRef = useRef<number>(0)
  const completedRef = useRef(false)

  onMinuteMarkRef.current = onMinuteMark
  onCompleteRef.current = onComplete
  onTickRef.current = onTick

  const recalculate = useCallback(() => {
    if (!startTimeRef.current) return

    const realSeconds = pausedAccumulatorRef.current + (Date.now() - startTimeRef.current) / 1000
    const newElapsed = Math.floor(realSeconds * speedMultiplier)

    setElapsedSeconds(newElapsed)

    const currentMinute = Math.floor(newElapsed / 60)
    if (currentMinute > lastMinuteRef.current) {
      lastMinuteRef.current = currentMinute
      onMinuteMarkRef.current?.(currentMinute)
    }

    if (targetSeconds) {
      const remaining = Math.max(0, targetSeconds - newElapsed)
      onTickRef.current?.(remaining)

      if (newElapsed >= targetSeconds && !completedRef.current) {
        completedRef.current = true
        setIsRunning(false)
        onCompleteRef.current?.(newElapsed)
      }
    }
  }, [targetSeconds, speedMultiplier])

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now()
      completedRef.current = false
      const intervalMs = Math.max(50, 1000 / speedMultiplier)
      intervalRef.current = setInterval(recalculate, intervalMs)

      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          recalculate()
        }
      }
      document.addEventListener("visibilitychange", handleVisibility)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        document.removeEventListener("visibilitychange", handleVisibility)
        if (startTimeRef.current) {
          pausedAccumulatorRef.current += (Date.now() - startTimeRef.current) / 1000
          startTimeRef.current = 0
        }
      }
    }
  }, [isRunning, targetSeconds, speedMultiplier, recalculate])

  const formattedTime = useMemo(() => {
    const displaySeconds = countUp
      ? elapsedSeconds
      : Math.max(0, (targetSeconds || 0) - elapsedSeconds)
    const mins = Math.floor(displaySeconds / 60)
    const secs = displaySeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [elapsedSeconds, countUp, targetSeconds])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setElapsedSeconds(0)
    lastMinuteRef.current = 0
    pausedAccumulatorRef.current = 0
    startTimeRef.current = 0
    completedRef.current = false
  }, [])
  const resetTo = useCallback((seconds: number) => {
    setElapsedSeconds(seconds)
    lastMinuteRef.current = Math.floor(seconds / 60)
    pausedAccumulatorRef.current = seconds / speedMultiplier
    startTimeRef.current = 0
    completedRef.current = false
  }, [speedMultiplier])

  const remainingSeconds = useMemo(() => {
    if (!targetSeconds) return 0
    return Math.max(0, targetSeconds - elapsedSeconds)
  }, [targetSeconds, elapsedSeconds])

  return {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    start,
    pause,
    reset,
    resetTo,
    formattedTime,
  }
}
