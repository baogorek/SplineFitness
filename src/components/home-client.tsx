"use client"

import { useSyncExternalStore } from "react"
import { WorkoutLogger } from "@/components/workout-logger"
import { useAuth } from "@/components/auth-provider"

function subscribeToClientReady() {
  return () => {}
}

export function HomeClient() {
  const { loading } = useAuth()
  const mounted = useSyncExternalStore(subscribeToClientReady, () => true, () => false)

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
