"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Timer, Dumbbell, Clock, Zap, BookOpen } from "lucide-react"
import { WorkoutHistoryEntry, WorkoutSession } from "@/types/workout"
import { formatDisplayDate } from "./calendar-utils"

interface WorkoutDetailModalProps {
  date: Date
  workouts: WorkoutHistoryEntry[]
  onClose: () => void
}

function WorkoutDataView({ session }: { session: WorkoutSession }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Data</p>
      <pre className="rounded-lg bg-muted/50 p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  )
}

export function WorkoutDetailModal({ date, workouts, onClose }: WorkoutDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 border-border bg-card max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{formatDisplayDate(date)}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto flex-1">
          {workouts.map((entry) => (
            <div key={entry.id} className="space-y-3">
              <div className="flex items-center gap-2">
                {entry.session.mode === "circuit" ? (
                  <Timer className="h-4 w-4 text-primary" />
                ) : entry.session.mode === "interval" ? (
                  <Timer className="h-4 w-4 text-red-500" />
                ) : entry.session.mode === "sit" ? (
                  <Zap className="h-4 w-4 text-green-500" />
                ) : entry.session.mode === "coached" ? (
                  <BookOpen className="h-4 w-4 text-purple-500" />
                ) : (
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                )}
                <Badge variant="outline">
                  {entry.session.mode === "circuit"
                    ? `Resistance ${entry.session.variant}`
                    : entry.session.mode === "interval"
                    ? "4x4 Interval"
                    : entry.session.mode === "sit"
                    ? "SIT Sprint"
                    : entry.session.mode === "coached"
                    ? `Coached: ${entry.session.workoutName}`
                    : `Traditional ${entry.session.variant}`}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.completedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <WorkoutDataView session={entry.session} />

              {workouts.indexOf(entry) < workouts.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
