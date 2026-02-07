"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Volume2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { circuitWorkoutA, circuitWorkoutB } from "@/data/circuit-workouts"
import { useAudio } from "@/hooks/use-audio"

interface ExerciseEntry {
  name: string
  videos: { url: string; label?: string }[]
  alternativeName?: string
  alternativeVideos?: { url: string; label?: string }[]
}

interface ExercisesByCategory {
  [category: string]: ExerciseEntry[]
}

function getExercisesByCategory(): ExercisesByCategory {
  const grouped: ExercisesByCategory = {}
  const seen = new Set<string>()

  for (const workout of [circuitWorkoutA, circuitWorkoutB]) {
    for (const combo of workout.combos) {
      if (!grouped[combo.category]) {
        grouped[combo.category] = []
      }
      for (const ex of combo.subExercises) {
        if (seen.has(ex.id)) continue
        seen.add(ex.id)
        const entry: ExerciseEntry = {
          name: ex.name,
          videos: ex.videos || [],
        }
        if (ex.alternative) {
          entry.alternativeName = ex.alternative.name
          entry.alternativeVideos = ex.alternative.videos || []
        }
        grouped[combo.category].push(entry)
      }
    }
  }

  return grouped
}

export default function ExercisesPage() {
  const { speak } = useAudio()
  const exercisesByCategory = getExercisesByCategory()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/spline_logo.svg" alt="Spline Fitness" width={28} height={28} />
            <span className="font-semibold text-foreground">Exercise Library</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground mb-8">
          All exercises from the circuit training program. Tap the speaker icon to hear the name, or the link icon for a video demo.
        </p>

        <div className="space-y-8">
          {Object.entries(exercisesByCategory).map(([category, exercises]) => (
            <section key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {exercises.map((entry) => (
                      <li key={entry.name} className="flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-foreground">{entry.name}</span>
                          <div className="flex items-center gap-1">
                            {entry.videos.map((video, i) => (
                              <a
                                key={i}
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Watch ${entry.name} ${video.label || "demo"}`}
                              >
                                <Button variant="ghost" size="icon-sm">
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </a>
                            ))}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => speak(entry.name)}
                              aria-label={`Speak ${entry.name}`}
                            >
                              <Volume2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        {entry.alternativeName && (
                          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/50">
                            <span className="text-sm text-muted-foreground">
                              or: {entry.alternativeName}
                            </span>
                            <div className="flex items-center gap-1">
                              {entry.alternativeVideos?.map((video, i) => (
                                <a
                                  key={i}
                                  href={video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Watch ${entry.alternativeName} ${video.label || "demo"}`}
                                >
                                  <Button variant="ghost" size="icon-sm">
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </a>
                              ))}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => speak(entry.alternativeName!)}
                                aria-label={`Speak ${entry.alternativeName}`}
                              >
                                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
