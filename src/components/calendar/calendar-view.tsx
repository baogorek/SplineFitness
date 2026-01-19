"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, Timer, Dumbbell } from "lucide-react"
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
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutHistoryEntry[]>([])
  const [workoutsByDate, setWorkoutsByDate] = useState<Map<string, WorkoutHistoryEntry[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutHistoryEntry[]>([])

  useEffect(() => {
    setCurrentMonth(new Date())
    async function fetchHistory() {
      const history = await getWorkoutHistory()
      setWorkouts(history)
      setWorkoutsByDate(groupWorkoutsByDate(history))
      setLoading(false)
    }
    fetchHistory()
  }, [])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => prev ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1) : new Date())
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1) : new Date())
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
  const traditionalCount = workouts.filter((w) => w.session.mode === "traditional").length

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
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-primary" />
                {circuitCount}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3 text-blue-500" />
                {traditionalCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} disabled={!currentMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {currentMonth ? formatMonthYear(currentMonth) : "Loading..."}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={!currentMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading || !currentMonth ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : (
          <CalendarGrid
            currentMonth={currentMonth}
            workoutsByDate={workoutsByDate}
            onDayClick={handleDayClick}
          />
        )}

        {workouts.length === 0 && !loading && (
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
                <Button onClick={signInWithGoogle} className="mt-4">
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
