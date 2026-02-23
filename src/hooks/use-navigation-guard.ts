"use client"

import { useEffect, useRef } from "react"

export function useNavigationGuard(active: boolean) {
  const guardActiveRef = useRef(false)

  useEffect(() => {
    if (!active) {
      guardActiveRef.current = false
      return
    }

    guardActiveRef.current = true

    const pushState = () => {
      window.history.pushState({ navigationGuard: true }, "")
    }

    pushState()

    const handlePopState = () => {
      if (guardActiveRef.current) {
        pushState()
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (guardActiveRef.current) {
        e.preventDefault()
      }
    }

    window.addEventListener("popstate", handlePopState)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      guardActiveRef.current = false
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [active])
}
