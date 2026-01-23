"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Volume2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { circuitWorkoutA, circuitWorkoutB } from "@/data/circuit-workouts"
import { useAudio } from "@/hooks/use-audio"

interface ExercisesByCategory {
  [category: string]: string[]
}

const exerciseVideos: Record<string, { videoId: string; startSeconds: number }> = {
  "Alt. Single Leg Box Squats": { videoId: "vc1E5CfRfos", startSeconds: 242 },
}

function getExercisesByCategory(): ExercisesByCategory {
  const grouped: ExercisesByCategory = {}

  for (const workout of [circuitWorkoutA, circuitWorkoutB]) {
    for (const combo of workout.combos) {
      if (!grouped[combo.category]) {
        grouped[combo.category] = []
      }
      for (const ex of combo.subExercises) {
        if (!grouped[combo.category].includes(ex.name)) {
          grouped[combo.category].push(ex.name)
        }
      }
    }
  }

  return grouped
}

export default function ExercisesPage() {
  const { speak } = useAudio()
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
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
          All exercises from the circuit training program. Tap the speaker icon to hear the name.
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
                    {exercises.map((name) => {
                      const video = exerciseVideos[name]
                      const isExpanded = expandedVideo === name
                      return (
                        <li key={name} className="flex flex-col">
                          <div className="flex items-center justify-between px-4 py-3">
                            <span className="text-foreground">{name}</span>
                            <div className="flex items-center gap-1">
                              {video && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setExpandedVideo(isExpanded ? null : name)}
                                  aria-label={`${isExpanded ? "Hide" : "Show"} video for ${name}`}
                                >
                                  <Play className={`h-4 w-4 ${isExpanded ? "text-primary" : "text-muted-foreground"}`} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => speak(name)}
                                aria-label={`Speak ${name}`}
                              >
                                <Volume2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                          {video && isExpanded && (
                            <div className="px-4 pb-4">
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                <iframe
                                  className="absolute inset-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${video.videoId}?start=${video.startSeconds}&rel=0`}
                                  title={`${name} demonstration`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          )}
                        </li>
                      )
                    })}
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
