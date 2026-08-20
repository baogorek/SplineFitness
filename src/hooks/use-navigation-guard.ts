"use client"

import { useEffect, useRef } from "react"

export function useNavigationGuard(active: boolean) {
  const guardActiveRef = useRef(false)

  useEffect(() => {
    if (!active) {
      guardActiveRef.current = false
      return
    }

    const guardId = crypto.randomUUID()
    let installed = false
    let restoringGuardEntry = false

    const handlePopState = () => {
      if (!guardActiveRef.current) return
      if (restoringGuardEntry) {
        restoringGuardEntry = false
        return
      }
      restoringGuardEntry = true
      window.history.forward()
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (guardActiveRef.current) {
        e.preventDefault()
      }
    }

    // Deferring installation avoids duplicate entries from React's development
    // effect replay while still installing before a user can leave a workout.
    const installTimer = window.setTimeout(() => {
      guardActiveRef.current = true
      window.history.pushState({ navigationGuard: guardId }, "", window.location.href)
      installed = true
      window.addEventListener("popstate", handlePopState)
      window.addEventListener("beforeunload", handleBeforeUnload)
    }, 0)

    return () => {
      window.clearTimeout(installTimer)
      guardActiveRef.current = false
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (installed && window.history.state?.navigationGuard === guardId) {
        window.history.back()
      }
    }
  }, [active])
}
