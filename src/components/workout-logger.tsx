"use client"

import { useState, useEffect } from "react"
import { Dumbbell, Timer, LogOut, LogIn, Calendar, UserPlus, BookOpen, Volume2, ChevronRight, HeartPulse } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WorkoutMode } from "@/types/workout"
import { CircuitWorkout } from "./circuit/circuit-workout"
import { TraditionalWorkout } from "./traditional/traditional-workout"
import { IntervalWorkout } from "./interval/interval-workout"
import { CalendarView } from "./calendar/calendar-view"
import { BookingView } from "./booking/booking-view"
import { useAuth } from "./auth-provider"
import { getCircuitProgress } from "@/lib/storage"
import { FEATURES } from "@/lib/feature-flags"
import { PwaInstallBanner } from "./pwa-install-banner"

type AppMode = WorkoutMode | "history" | "booking"

const workoutModes = [
  {
    id: "circuit" as const,
    icon: Timer,
    title: "Resistance",
    subtitle: "Low equipment",
    description: "Timed combo rounds with bodyweight exercises",
    color: "bg-orange-500",
    lightBg: "bg-orange-50",
    border: "border-orange-200",
    hoverBorder: "hover:border-orange-300",
    iconColor: "text-orange-600",
  },
  {
    id: "interval" as const,
    icon: HeartPulse,
    title: "4x4 Interval",
    subtitle: "High intensity",
    description: "4-minute intervals with physiology coaching",
    color: "bg-red-500",
    lightBg: "bg-red-50",
    border: "border-red-200",
    hoverBorder: "hover:border-red-300",
    iconColor: "text-red-600",
  },
  {
    id: "traditional" as const,
    icon: Dumbbell,
    title: "Traditional",
    subtitle: "Sets & reps",
    description: "Classic strength training with weight tracking",
    color: "bg-blue-500",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-300",
    iconColor: "text-blue-600",
  },
  {
    id: "history" as const,
    icon: Calendar,
    title: "History",
    subtitle: "Your progress",
    description: "View past workouts on calendar",
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    hoverBorder: "hover:border-emerald-300",
    iconColor: "text-emerald-600",
  },
  {
    id: "booking" as const,
    icon: UserPlus,
    title: "Coaching",
    subtitle: "1-on-1 sessions",
    description: "Book personal training",
    color: "bg-violet-500",
    lightBg: "bg-violet-50",
    border: "border-violet-200",
    hoverBorder: "hover:border-violet-300",
    iconColor: "text-violet-600",
  },
]

function ModeSelection({ onSelectMode }: { onSelectMode: (mode: AppMode) => void }) {
  const { user, signOut, signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.5) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-end p-4 gap-4">
        {FEATURES.AUTH_ENABLED ? (
          user ? (
            <>
              <span className="text-sm text-slate-500 hidden sm:block">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-400">Guest mode (workouts won&apos;t be saved)</span>
              <Button
                size="sm"
                onClick={signInWithGoogle}
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              >
                <LogIn className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            </>
          )
        ) : (
          <span className="text-sm text-slate-400">Sign in coming soon</span>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 pb-8">
        {/* Logo hero */}
        <div className="text-center mb-8 sm:mb-10">
          <Image
            src="/spline_logo.svg"
            alt="Spline Fitness"
            width={280}
            height={280}
            priority
            className="mx-auto"
          />
        </div>

        <PwaInstallBanner />

        {/* Workout mode cards */}
        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workoutModes.map((mode, index) => (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`group relative rounded-2xl bg-white border-2 ${mode.border} ${mode.hoverBorder} p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${index === workoutModes.length - 1 && workoutModes.length % 2 !== 0 ? "sm:col-span-2" : ""}`}
              >
                {/* Colored accent bar */}
                <div className={`absolute top-0 left-6 right-6 h-1 ${mode.color} rounded-b-full`} />

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${mode.lightBg} mb-4 transition-transform duration-200 group-hover:scale-110`}>
                  <mode.icon className={`h-7 w-7 ${mode.iconColor}`} />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                      {mode.title}
                    </h2>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition-all duration-200 group-hover:text-slate-500 group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    {mode.subtitle}
                  </p>
                  <p className="text-sm text-slate-500 pt-1">
                    {mode.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Secondary links */}
          <div className="mt-4 space-y-3">
            <Link
              href="/exercises"
              className="group flex items-center justify-between rounded-xl bg-white border border-slate-200 p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                  <Volume2 className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Exercise Library</h3>
                  <p className="text-xs text-slate-400">Browse exercises & hear their names</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 transition-all duration-200 group-hover:text-slate-500 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/blog"
              className="group flex items-center justify-between rounded-xl bg-white border border-slate-200 p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                  <BookOpen className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Blog</h3>
                  <p className="text-xs text-slate-400">Fitness tips & training insights</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 transition-all duration-200 group-hover:text-slate-500 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Footer links */}
          <div className="mt-8 flex justify-center gap-6 text-xs text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export function WorkoutLogger() {
  const [mode, setMode] = useState<AppMode | null>(null)

  useEffect(() => {
    if (getCircuitProgress()) {
      setMode("circuit")
    }
  }, [])

  const handleModeChange = () => {
    setMode(null)
  }

  if (mode === "circuit") {
    return <CircuitWorkout onModeChange={handleModeChange} />
  }

  if (mode === "interval") {
    return <IntervalWorkout onModeChange={handleModeChange} />
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
