import { WorkoutLogger } from "@/components/workout-logger"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <WorkoutLogger />
    </main>
  )
}
