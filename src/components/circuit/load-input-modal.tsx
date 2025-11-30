"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { Combo, SubExercise } from "@/types/workout"

interface LoadInputModalProps {
  combo: Combo
  onSave: (loads: Record<string, number>) => void
}

export function LoadInputModal({ combo, onSave }: LoadInputModalProps) {
  const [loads, setLoads] = useState<Record<string, number>>(() =>
    Object.fromEntries(combo.subExercises.map((sub) => [sub.id, 50]))
  )

  const handleChange = (subId: string, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setLoads((prev) => ({ ...prev, [subId]: num }))
    } else if (value === "") {
      setLoads((prev) => ({ ...prev, [subId]: 0 }))
    }
  }

  const handleSave = () => {
    onSave(loads)
  }

  const avgLoad = Math.round(
    combo.subExercises.reduce((acc, sub) => acc + (loads[sub.id] || 0), 0) /
      combo.subExercises.length
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Card className="relative z-10 w-full max-w-md mx-4 mb-4 sm:mb-0 border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Enter Load Metrics</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Estimate % of each minute you worked (vs rested)
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {combo.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {combo.subExercises.map((sub: SubExercise, index: number) => (
            <div key={sub.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {index + 1}. {sub.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {loads[sub.id]}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={loads[sub.id].toString()}
                  onChange={(e) => handleChange(sub.id, e.target.value)}
                  className="h-10 text-center font-mono text-lg w-24"
                />
                <span className="text-sm text-muted-foreground w-4">%</span>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Average Load</span>
              <span className="text-lg font-mono font-bold text-foreground">{avgLoad}%</span>
            </div>

            <Button onClick={handleSave} className="w-full h-12 text-base font-semibold">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
