"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Play, Flag, AlertTriangle } from "lucide-react"
import { CircuitRoundData } from "@/types/workout"
import { formatTime } from "@/lib/storage"

interface RoundSummaryProps {
  roundData: CircuitRoundData
  allRounds: CircuitRoundData[]
  onStartNextRound: () => void
  onFinishWorkout: () => void
}

export function RoundSummary({
  roundData,
  allRounds,
  onStartNextRound,
  onFinishWorkout,
}: RoundSummaryProps) {
  const completedCount = roundData.comboResults.filter(
    (r) => r.completedWithoutStopping
  ).length
  const totalCount = roundData.comboResults.length
  const completionRate = Math.round((completedCount / totalCount) * 100)

  const weakLinks = roundData.comboResults
    .filter((r) => !r.completedWithoutStopping && r.weakLinkExerciseId)
    .map((r) => r.weakLinkExerciseId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-md border-border bg-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Round {roundData.round} Complete!</h2>
          <p className="text-muted-foreground mt-1">Great work on completing the round</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total Time
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {formatTime(roundData.totalTimeSeconds)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Completion
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {completedCount}/{totalCount}
              </p>
            </div>
          </div>

          {weakLinks.length > 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Weak Links This Round</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {weakLinks.length} exercise{weakLinks.length !== 1 ? "s" : ""} identified for practice
              </p>
            </div>
          )}

          {allRounds.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                All Rounds
              </p>
              <div className="space-y-2">
                {allRounds.map((round) => {
                  const roundCompleted = round.comboResults.filter(
                    (r) => r.completedWithoutStopping
                  ).length
                  const roundTotal = round.comboResults.length
                  return (
                    <div
                      key={round.round}
                      className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                    >
                      <Badge variant="secondary" className="text-xs">
                        Round {round.round}
                      </Badge>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {roundCompleted}/{roundTotal}
                        </span>
                        <span className="font-mono text-sm text-foreground">
                          {formatTime(round.totalTimeSeconds)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={onStartNextRound}
              className="w-full h-12 text-base font-semibold"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Round {roundData.round + 1}
            </Button>
            <Button
              variant="outline"
              onClick={onFinishWorkout}
              className="w-full h-12 text-base font-semibold"
            >
              <Flag className="mr-2 h-5 w-5" />
              Finish Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
