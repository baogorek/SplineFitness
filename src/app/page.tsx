"use client"

import { WorkoutLogger } from "@/components/workout-logger"
import { LoginScreen } from "@/components/login-screen"
import { useAuth } from "@/components/auth-provider"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoginScreen />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <WorkoutLogger />
    </main>
  )
}
