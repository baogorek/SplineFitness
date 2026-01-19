"use client"

import { useState, useEffect } from "react"
import { WorkoutLogger } from "@/components/workout-logger"
import { useAuth } from "@/components/auth-provider"

export function HomeClient() {
  const { loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <WorkoutLogger />
    </main>
  )
}
