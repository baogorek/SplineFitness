"use client"

import { useEffect, useRef } from "react"

export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) {
      wakeLockRef.current?.release()
      wakeLockRef.current = null
      return
    }

    let cancelled = false

    async function acquire() {
      if (!("wakeLock" in navigator)) return
      try {
        const sentinel = await navigator.wakeLock.request("screen")
        if (cancelled) {
          sentinel.release()
        } else {
          wakeLockRef.current = sentinel
        }
      } catch {
        // Wake lock request failed (e.g. low battery, tab hidden)
      }
    }

    acquire()

    // Re-acquire on visibility change (browser releases wake lock when tab is hidden)
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && active && !cancelled) {
        acquire()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      wakeLockRef.current?.release()
      wakeLockRef.current = null
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [active])
}
