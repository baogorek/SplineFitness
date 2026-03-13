"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface PerformanceDropModalProps {
  shortMA: number
  longMA: number
  onContinue: () => void
  onEndWorkout: () => void
}

export function PerformanceDropModal({
  shortMA,
  longMA,
  onContinue,
  onEndWorkout,
}: PerformanceDropModalProps) {
  const dropPercent = (((shortMA - longMA) / longMA) * 100).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-sm mx-4 border-yellow-300 bg-card">
        <CardHeader className="pb-2 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-foreground">Fatigue Detected (&gt;5% Slower)</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-xs text-muted-foreground">Session Avg</p>
              <p className="text-xl font-mono font-bold text-green-600">{longMA.toFixed(1)}s</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs text-muted-foreground">Recent Avg</p>
              <p className="text-xl font-mono font-bold text-red-600">{shortMA.toFixed(1)}s</p>
            </div>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Your last 2 sprints averaged {dropPercent}% slower than your session average. Risk of hamstring strain is high. Recommended: End Workout Now.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onContinue}>
              Continue
            </Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onEndWorkout}>
              End Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
