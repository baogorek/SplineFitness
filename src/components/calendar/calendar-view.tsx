"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Activity, ArrowLeft, ChevronLeft, ChevronRight, Timer, Dumbbell, Gauge, HeartPulse, Zap, RefreshCw } from "lucide-react"
import { WorkoutHistoryEntry } from "@/types/workout"
import { getWorkoutHistory } from "@/lib/storage"
import { formatMonthYear, groupWorkoutsByDate } from "./calendar-utils"
import { CalendarGrid } from "./calendar-grid"
import { WorkoutDetailModal } from "./workout-detail-modal"
import { useAuth } from "@/components/auth-provider"

interface CalendarViewProps {
  onBack: () => void
}

export function CalendarView({ onBack }: CalendarViewProps) {
  const { user, signInWithGoogle } = useAuth()
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date())
  const [workouts, setWorkouts] = useState<WorkoutHistoryEntry[]>([])
  const [workoutsByDate, setWorkoutsByDate] = useState<Map<string, WorkoutHistoryEntry[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryEntry[]>([])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    setWorkouts([])
    setWorkoutsByDate(new Map())
    try {
      const history = await getWorkoutHistory()
      setWorkouts(history)
      setWorkoutsByDate(groupWorkoutsByDate(history))
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory, user])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleDayClick = (date: Date, dayWorkouts: WorkoutHistoryEntry[]) => {
    if (dayWorkouts.length > 0) {
      setSelectedDate(date)
      setSelectedWorkouts(dayWorkouts)
    }
  }

  const handleCloseModal = () => {
    setSelectedDate(null)
    setSelectedWorkouts([])
  }

  const circuitCount = workouts.filter((w) => w.session.mode === "circuit").length
  const freeformCount = workouts.filter((w) => w.session.mode === "freeform" || w.session.mode === "traditional" as string).length
  const vo2MaxCount = workouts.filter((w) => w.session.mode === "vo2max").length
  const lissCoreCount = workouts.filter((w) => w.session.mode === "liss-core").length
  const intervalCount = workouts.filter((w) => w.session.mode === "interval").length
  const sitCount = workouts.filter((w) => w.session.mode === "sit").length

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                HISTORY
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1" title="Circuit workouts">
                <Timer className="h-3 w-3 text-primary" />
                <span aria-hidden="true">{circuitCount}</span>
                <span className="sr-only">{circuitCount} circuit workouts</span>
              </span>
              <span className="flex items-center gap-1" title="Freeform workouts">
                <Dumbbell className="h-3 w-3 text-blue-500" />
                <span aria-hidden="true">{freeformCount}</span>
                <span className="sr-only">{freeformCount} freeform workouts</span>
              </span>
              <span className="flex items-center gap-1" title="Interval workouts">
                <HeartPulse className="h-3 w-3 text-red-500" />
                <span aria-hidden="true">{intervalCount}</span>
                <span className="sr-only">{intervalCount} interval workouts</span>
              </span>
              <span className="flex items-center gap-1" title="SIT workouts">
                <Zap className="h-3 w-3 text-green-500" />
                <span aria-hidden="true">{sitCount}</span>
                <span className="sr-only">{sitCount} SIT workouts</span>
              </span>
              <span className="flex items-center gap-1" title="VO2 Max workouts">
                <Gauge className="h-3 w-3 text-cyan-500" />
                <span aria-hidden="true">{vo2MaxCount}</span>
                <span className="sr-only">{vo2MaxCount} VO2 Max workouts</span>
              </span>
              <span className="flex items-center gap-1" title="LISS and Core workouts">
                <Activity className="h-3 w-3 text-violet-500" />
                <span aria-hidden="true">{lissCoreCount}</span>
                <span className="sr-only">{lissCoreCount} LISS and Core workouts</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {formatMonthYear(currentMonth)}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : loadError ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="font-medium text-foreground">Workout history could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" onClick={fetchHistory} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <CalendarGrid
            currentMonth={currentMonth}
            workoutsByDate={workoutsByDate}
            onDayClick={handleDayClick}
          />
        )}

        {workouts.length === 0 && !loading && !loadError && (
          <div className="text-center mt-8">
            {user ? (
              <>
                <p className="text-muted-foreground">No workouts recorded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete a workout to see it here!
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Sign in to track your workout history</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your workouts will be saved and displayed here when you sign in.
                </p>
                <Button onClick={() => void signInWithGoogle().catch((error) => console.error("Sign-in error:", error))} className="mt-4">
                  Sign in with Google
                </Button>
              </>
            )}
          </div>
        )}
      </main>

      {selectedDate && selectedWorkouts.length > 0 && (
        <WorkoutDetailModal
          date={selectedDate}
          workouts={selectedWorkouts}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
