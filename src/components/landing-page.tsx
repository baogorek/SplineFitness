"use client"

import Image from "next/image"
import Link from "next/link"
import { Timer, Dumbbell, Calendar, UserPlus, ArrowRight, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BlogPostCard } from "@/components/blog/blog-post-card"
import { useAuth } from "./auth-provider"
import { BlogPostMeta } from "@/types/blog"

const features = [
  {
    icon: Timer,
    title: "Circuit Training",
    description: "Timed workout combos with customizable rounds and rest periods",
  },
  {
    icon: Dumbbell,
    title: "Traditional Lifting",
    description: "Track sets, reps, and weight for strength training sessions",
  },
  {
    icon: Calendar,
    title: "Workout History",
    description: "View and analyze your past workouts on a calendar",
  },
  {
    icon: UserPlus,
    title: "1-on-1 Coaching",
    description: "Book personal training sessions with experienced coaches",
  },
  {
    icon: GraduationCap,
    title: "NSCA-CPT Practice",
    description: "Practice questions to master fitness science and certification prep",
    href: "/practice",
  },
]

interface LandingPageProps {
  posts: BlogPostMeta[]
}

export function LandingPage({ posts }: LandingPageProps) {
  const { signInWithGoogle, loading } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="pt-12 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <Image
                src="/spline_logo.svg"
                alt="Spline Fitness"
                width={200}
                height={200}
                priority
                className="mx-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Track Your Workouts,
              <br />
              <span className="text-primary">Build Your Strength</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              A simple, focused workout tracker for circuit training and traditional lifting.
              Log your sessions, track your progress, and stay consistent.
            </p>
            <Button onClick={signInWithGoogle} disabled={loading} size="lg" className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">
              Everything you need to train smarter
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const cardContent = (
                  <Card
                    key={feature.title}
                    className={`bg-background ${feature.href ? "cursor-pointer transition-all hover:border-primary hover:shadow-lg" : ""}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                )

                return feature.href ? (
                  <Link key={feature.title} href={feature.href}>
                    {cardContent}
                  </Link>
                ) : (
                  cardContent
                )
              })}
            </div>
          </div>
        </section>

        {posts.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-foreground">
                  From the Blog
                </h2>
                <Link href="/blog">
                  <Button variant="ghost" className="gap-2">
                    View all posts
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/spline_logo.svg" alt="Spline Fitness" width={50} height={50} />
            <span className="text-sm text-muted-foreground">Spline Fitness</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
