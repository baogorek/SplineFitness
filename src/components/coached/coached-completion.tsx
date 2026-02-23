"use client"

import { BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CoachedWorkoutSession } from "@/types/workout"
import { useAuth } from "@/components/auth-provider"
import { FEATURES } from "@/lib/feature-flags"
import { formatTime } from "@/lib/storage"

interface CoachedCompletionProps {
  session: CoachedWorkoutSession
  savedToHistory: boolean
  onBack: () => void
}

function buildGoogleCalendarUrl(session: CoachedWorkoutSession): string {
  const toCalDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+Z/, "Z")
  const mins = Math.floor(session.totalTimeSeconds / 60)
  const secs = (session.totalTimeSeconds % 60).toString().padStart(2, "0")

  const lines = [
    `Workout: ${session.workoutName}`,
    `Phases Completed: ${session.phasesCompleted.length}/5`,
    `Total Time: ${mins}:${secs}`,
  ]

  let details = lines.join("\n")
  if (details.length > 1500) {
    details = details.slice(0, 1497) + "..."
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Coached Lifting: ${session.workoutName}`,
    dates: `${toCalDate(session.startedAt)}/${toCalDate(session.completedAt || session.startedAt)}`,
    details,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function CoachedCompletion({ session, savedToHistory, onBack }: CoachedCompletionProps) {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md w-full">
        <div className="h-20 w-20 rounded-full bg-purple-500 flex items-center justify-center mx-auto">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
        <p className="text-muted-foreground">{session.workoutName}</p>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total Time
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {formatTime(session.totalTimeSeconds)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Phases
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {session.phasesCompleted.length}/5
            </p>
          </div>
        </div>

        <a
          href={buildGoogleCalendarUrl(session)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors w-full mt-2"
        >
          <Calendar className="h-4 w-4" />
          Add to Google Calendar
        </a>

        {FEATURES.AUTH_ENABLED && (
          savedToHistory ? (
            <div className="rounded-lg bg-green-600/10 border border-green-600/20 p-3 mt-4">
              <p className="text-sm text-green-600 font-medium">Saved to workout history</p>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-600/10 border border-amber-600/20 p-4 mt-4">
              <p className="text-sm text-amber-600 font-medium">
                Sign in to save your workouts and track progress over time
              </p>
              <Button variant="outline" size="sm" onClick={signInWithGoogle} className="mt-3">
                Sign in with Google
              </Button>
            </div>
          )
        )}

        <button
          onClick={onBack}
          className="mt-6 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors w-full"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
