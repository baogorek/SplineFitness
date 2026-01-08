"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Dumbbell } from "lucide-react"
import { movementScenarios, getAllExercises, getRandomScenario } from "@/data/muscle-formula/scenarios"
import { MovementScenario } from "@/types/muscle-formula"

interface ScenarioSelectorProps {
  onSelect: (scenario: MovementScenario) => void
}

export function ScenarioSelector({ onSelect }: ScenarioSelectorProps) {
  const exercises = getAllExercises()

  const handleRandomMode = () => {
    const randomScenario = getRandomScenario()
    onSelect(randomScenario)
  }

  const scenariosByExercise = exercises.reduce((acc, exercise) => {
    acc[exercise] = movementScenarios.filter(s => s.exerciseName === exercise)
    return acc
  }, {} as Record<string, MovementScenario[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Select a Scenario</h2>
          <p className="text-sm text-muted-foreground">
            Choose a movement to analyze, or try random mode for exam practice
          </p>
        </div>
        <Button onClick={handleRandomMode} variant="outline" className="gap-2">
          <Shuffle className="w-4 h-4" />
          Random Mode
        </Button>
      </div>

      <div className="space-y-6">
        {exercises.map(exercise => (
          <div key={exercise}>
            <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              {exercise}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {scenariosByExercise[exercise].map(scenario => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onSelect(scenario)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {scenario.phase === "upward" ? "Upward" : "Downward"} Phase
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {scenario.jointLabel}
                        </div>
                      </div>
                      <Badge variant={scenario.phase === "upward" ? "default" : "secondary"}>
                        {scenario.phase === "upward" ? "Concentric" : "Eccentric"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {movementScenarios.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No scenarios available yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
