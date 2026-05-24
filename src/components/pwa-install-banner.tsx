"use client"

import { useState, useSyncExternalStore } from "react"
import { Share, Ellipsis, EllipsisVertical, X, SquarePlus } from "lucide-react"

type Platform = "ios" | "android" | null
type InstallState = Exclude<Platform, null> | null
type NavigatorWithStandalone = Navigator & { standalone?: boolean }

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
    (navigator as NavigatorWithStandalone).standalone === true
  )
}

function getInstallState(): InstallState {
  if (typeof window === "undefined") return null
  if (isStandalone()) return null
  let dismissed: string | null = null
  try {
    dismissed = localStorage.getItem("pwa-banner-dismissed")
  } catch {
    dismissed = null
  }
  if (dismissed) return null
  return getPlatform()
}

function subscribeToInstallState(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const id = window.setTimeout(onStoreChange, 0)
  return () => window.clearTimeout(id)
}

export function PwaInstallBanner() {
  const installState = useSyncExternalStore(subscribeToInstallState, getInstallState, () => null)
  const [dismissed, setDismissed] = useState(false)

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem("pwa-banner-dismissed", "1")
    } catch {
      // Storage may be unavailable in restricted browser modes.
    }
  }

  if (!installState || dismissed) return null

  const platform = installState

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
          Steps to add to home screen
        </p>

        {platform === "ios" ? (
          <div className="flex flex-col gap-1.5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="font-medium">1.</span>
              Tap{" "}
              <Ellipsis className="inline h-4 w-4 text-slate-500" />
              in Safari
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">2.</span>
              Tap{" "}
              <Share className="inline h-4 w-4 text-blue-500" />
              Share
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">3.</span>
              Tap{" "}
              <Ellipsis className="inline h-4 w-4 text-slate-500" />
              More
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">4.</span>
              <SquarePlus className="inline h-4 w-4 text-slate-500" />
              Add to Home Screen
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="font-medium">1.</span>
              Tap{" "}
              <EllipsisVertical className="inline h-4 w-4 text-slate-500" />
              in Chrome
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">2.</span>
              Add to Home Screen
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
