"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Cal from "@calcom/embed-react"

interface BookingViewProps {
  onBack: () => void
}

export function BookingView({ onBack }: BookingViewProps) {
  return (
    <div className="min-h-screen bg-background p-4 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Book a Training Session</h1>
      </div>
      <div className="rounded-lg overflow-hidden">
        <Cal
          calLink="ben-ogorek-viytve"
          config={{
            theme: "dark",
          }}
        />
      </div>
    </div>
  )
}
