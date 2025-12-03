"use client"

import { useState } from "react"
import { Dumbbell, Timer, LogOut, Calendar, UserPlus, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkoutMode } from "@/types/workout"
import { CircuitWorkout } from "./circuit/circuit-workout"
import { TraditionalWorkout } from "./traditional/traditional-workout"
import { CalendarView } from "./calendar/calendar-view"
import { BookingView } from "./booking/booking-view"
import { useAuth } from "./auth-provider"

type AppMode = WorkoutMode | "history" | "booking"

function ModeSelection({ onSelectMode }: { onSelectMode: (mode: AppMode) => void }) {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>

      <div className="flex flex-col items-center mb-2">
        <Image src="/spline_logo.svg" alt="Spline Fitness" width={140} height={140} priority />
        <p className="text-sm text-muted-foreground mt-1">Select workout type</p>
      </div>

      <p className="text-xs text-muted-foreground mb-6">{user?.email}</p>

      <div className="grid gap-4 w-full max-w-md">
        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => onSelectMode("circuit")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Timer className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Circuit Training</h2>
              <p className="text-sm text-muted-foreground">
                Athlean-X style timed combos with rounds
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => onSelectMode("traditional")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Dumbbell className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Traditional</h2>
              <p className="text-sm text-muted-foreground">
                Sets, reps, and weight tracking
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => onSelectMode("history")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">History</h2>
              <p className="text-sm text-muted-foreground">
                View past workouts by date
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-lg"
          onClick={() => onSelectMode("booking")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Book 1-on-1</h2>
              <p className="text-sm text-muted-foreground">
                Schedule a personal training session
              </p>
            </div>
          </CardContent>
        </Card>

        <Link href="/blog">
          <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Blog</h2>
                <p className="text-sm text-muted-foreground">
                  Fitness tips and training insights
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export function WorkoutLogger() {
  const [mode, setMode] = useState<AppMode | null>(null)

  const handleModeChange = () => {
    setMode(null)
  }

  if (mode === "circuit") {
    return <CircuitWorkout onModeChange={handleModeChange} />
  }

  if (mode === "traditional") {
    return <TraditionalWorkout onModeChange={handleModeChange} />
  }

  if (mode === "history") {
    return <CalendarView onBack={handleModeChange} />
  }

  if (mode === "booking") {
    return <BookingView onBack={handleModeChange} />
  }

  return <ModeSelection onSelectMode={setMode} />
}
