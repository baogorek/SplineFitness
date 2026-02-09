"use client"

import { useState, useEffect } from "react"
import { Share, EllipsisVertical, X, Plus } from "lucide-react"

type Platform = "ios" | "android" | null

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return null
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return "ios"
  if (/Android/.test(ua)) return "android"
  return null
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  )
}

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>(null)

  useEffect(() => {
    if (isStandalone()) return
    const dismissed = localStorage.getItem("pwa-banner-dismissed")
    if (dismissed) return
    const p = getPlatform()
    if (!p) return
    setPlatform(p)
    setVisible(true)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem("pwa-banner-dismissed", "1")
  }

  if (!visible || !platform) return null

  return (
    <div className="w-full max-w-3xl mx-auto mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative rounded-xl border border-slate-200 bg-white p-4 pr-10 shadow-sm">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          Add to home screen
        </p>

        {platform === "ios" ? (
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-medium">1.</span>
              Tap{" "}
              <Share className="inline h-4 w-4 text-blue-500" />
              in Safari
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-medium">2.</span>
              <Plus className="inline h-4 w-4 text-slate-500" />
              Add to Home Screen
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-medium">1.</span>
              Tap{" "}
              <EllipsisVertical className="inline h-4 w-4 text-slate-500" />
              in Chrome
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-medium">2.</span>
              Add to Home Screen
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
