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

  onMinuteMarkRef.current = onMinuteMark
  onCompleteRef.current = onComplete
  onTickRef.current = onTick

  useEffect(() => {
    if (isRunning) {
      const intervalMs = Math.max(50, 1000 / speedMultiplier)
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1

          const currentMinute = Math.floor(next / 60)
          if (currentMinute > lastMinuteRef.current) {
            lastMinuteRef.current = currentMinute
            onMinuteMarkRef.current?.(currentMinute)
          }

          if (targetSeconds) {
            const remaining = targetSeconds - next
            onTickRef.current?.(remaining)

            if (next >= targetSeconds) {
              setIsRunning(false)
              onCompleteRef.current?.(next)
            }
          }

          return next
        })
      }, intervalMs)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, targetSeconds, speedMultiplier])

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
  }, [])
  const resetTo = useCallback((seconds: number) => {
    setElapsedSeconds(seconds)
    lastMinuteRef.current = Math.floor(seconds / 60)
  }, [])

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
