"use client"

import { ExternalLink, Youtube } from "lucide-react"

export function AttributionBanner() {
  return (
    <div className="rounded-lg bg-red-950/20 border border-red-900/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
          <Youtube className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Based on the "Perfect Home Workout" by Jeff Cavaliere
          </p>
          <a
            href="https://www.youtube.com/watch?v=vc1E5CfRfos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 mt-1 transition-colors"
          >
            Watch the original video
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
