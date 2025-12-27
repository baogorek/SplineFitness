"use client"

import { WorkoutLogger } from "@/components/workout-logger"
import { LandingPage } from "@/components/landing-page"
import { useAuth } from "@/components/auth-provider"
import { BlogPostMeta } from "@/types/blog"

interface HomeClientProps {
  posts: BlogPostMeta[]
}

export function HomeClient({ posts }: HomeClientProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return <LandingPage posts={posts} />
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <WorkoutLogger />
    </main>
  )
}
