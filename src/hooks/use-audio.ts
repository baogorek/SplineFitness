"use client"

import { useCallback, useMemo, useRef } from "react"

type RecoverableAudioContextState = AudioContextState | "interrupted"
type AudioDebugEntry = {
  timestamp: string
  message: string
}

const AUDIO_DEBUG_STORAGE_KEY = "spline_audio_debug_log"
const MAX_AUDIO_DEBUG_ENTRIES = 800
const audioContextIds = new WeakMap<AudioContext, number>()
let nextAudioContextId = 1
let audioDebugEntries: AudioDebugEntry[] | null = null

function getAudioContextId(ctx: AudioContext): number {
  const existingId = audioContextIds.get(ctx)
  if (existingId) return existingId

  const id = nextAudioContextId++
  audioContextIds.set(ctx, id)
  return id
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error)
}

function compactDebugText(text: string, maxLength = 140): string {
  const compacted = text.replace(/\s+/g, " ").trim()
  if (compacted.length <= maxLength) return compacted
  return `${compacted.slice(0, maxLength - 3)}...`
}

function loadAudioDebugEntries(): AudioDebugEntry[] {
  if (audioDebugEntries) return audioDebugEntries
  audioDebugEntries = []

  if (typeof window === "undefined") return audioDebugEntries

  try {
    const rawEntries = window.localStorage.getItem(AUDIO_DEBUG_STORAGE_KEY)
    if (!rawEntries) return audioDebugEntries

    const parsed = JSON.parse(rawEntries)
    if (Array.isArray(parsed)) {
      audioDebugEntries = parsed
        .filter((entry): entry is AudioDebugEntry =>
          entry &&
          typeof entry.timestamp === "string" &&
          typeof entry.message === "string"
        )
        .slice(-MAX_AUDIO_DEBUG_ENTRIES)
    }
  } catch {
    audioDebugEntries = []
  }

  return audioDebugEntries
}

function persistAudioDebugEntries(entries: AudioDebugEntry[]) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(AUDIO_DEBUG_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Keep the in-memory log even if localStorage is unavailable or full.
  }
}

function appendAudioDebug(message: string) {
  const entries = loadAudioDebugEntries()
  entries.push({
    timestamp: new Date().toISOString(),
    message,
  })

  if (entries.length > MAX_AUDIO_DEBUG_ENTRIES) {
    entries.splice(0, entries.length - MAX_AUDIO_DEBUG_ENTRIES)
  }

  persistAudioDebugEntries(entries)
}

function formatAudioDebugLog(): string {
  const entries = loadAudioDebugEntries()
  const header = [
    "Spline Fitness audio debug log",
    `Generated: ${new Date().toISOString()}`,
    typeof document !== "undefined" ? `Visibility: ${document.visibilityState}` : null,
    typeof navigator !== "undefined" ? `User agent: ${navigator.userAgent}` : null,
    `Entries: ${entries.length}`,
    "",
  ].filter((line): line is string => line !== null)

  const lines = entries.length > 0
    ? entries.map((entry) => `${entry.timestamp} ${entry.message}`)
    : ["No audio events have been recorded yet."]

  return [...header, ...lines].join("\n")
}

function clearAudioDebugLog() {
  audioDebugEntries = []
  persistAudioDebugEntries(audioDebugEntries)
}

function expandSpeechText(text: string): string {
  return text
    .replace(/^Alt\.\s/g, "Alternating ")
    .replace(/\bBW\b/g, "Bodyweight")
    .replace(/\b1 1\/2\b/g, "One and a Half")
    .replace(/\bVO2\b/g, "V O 2")
    .replace(/\bATP-PCr\b/g, "A T P phosphocreatine")
    .replace(/\bEPOC\b/g, "ee pock")
}

export function estimateSpeechSeconds(text: string): number {
  const expanded = expandSpeechText(text)
  const wordCount = expanded.split(/\s+/).filter(w => w.length > 0).length
  return Math.ceil(wordCount / 2)
}

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback((forceNew = false) => {
    if (typeof window === "undefined") return null

    if (forceNew && audioContextRef.current && audioContextRef.current.state !== "closed") {
      const oldCtx = audioContextRef.current
      appendAudioDebug(`audio context force-close requested ctx=#${getAudioContextId(oldCtx)} state=${oldCtx.state}`)
      void oldCtx.close()
        .then(() => appendAudioDebug(`audio context force-close resolved ctx=#${getAudioContextId(oldCtx)} state=${oldCtx.state}`))
        .catch((error) => appendAudioDebug(`audio context force-close failed ctx=#${getAudioContextId(oldCtx)} error=${formatError(error)}`))
      audioContextRef.current = null
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        try {
          audioContextRef.current = new AudioContextClass()
          const ctx = audioContextRef.current
          const ctxId = getAudioContextId(ctx)
          appendAudioDebug(`audio context created ctx=#${ctxId} state=${ctx.state} sampleRate=${ctx.sampleRate}`)
          ctx.onstatechange = () => {
            appendAudioDebug(`audio context statechange ctx=#${ctxId} state=${ctx.state}`)
          }
        } catch (error) {
          appendAudioDebug(`audio context creation failed error=${formatError(error)}`)
        }
      } else {
        appendAudioDebug("audio context unavailable: AudioContext constructor missing")
      }
    }
    return audioContextRef.current
  }, [])

  const resumeAudioContext = useCallback(async (ctx?: AudioContext | null, reason = "unspecified") => {
    let activeCtx = typeof ctx === "undefined" ? getAudioContext() : ctx
    if (!activeCtx) {
      appendAudioDebug(`audio context resume skipped reason=${reason} ctx=none`)
      return null
    }

    if (activeCtx.state === "closed") {
      appendAudioDebug(`audio context resume found closed ctx=#${getAudioContextId(activeCtx)} reason=${reason}`)
      activeCtx = getAudioContext(true)
      if (!activeCtx) {
        appendAudioDebug(`audio context resume failed reason=${reason} replacement=none`)
        return null
      }
    }

    const resume = async () => {
      if ((activeCtx.state as RecoverableAudioContextState) !== "running") {
        appendAudioDebug(`audio context resume attempt ctx=#${getAudioContextId(activeCtx)} state=${activeCtx.state} reason=${reason}`)
        await activeCtx.resume()
        appendAudioDebug(`audio context resume resolved ctx=#${getAudioContextId(activeCtx)} state=${activeCtx.state} reason=${reason}`)
      }
    }

    try {
      await resume()
      if ((activeCtx.state as RecoverableAudioContextState) !== "running") {
        await new Promise(resolve => setTimeout(resolve, 50))
        appendAudioDebug(`audio context resume retry ctx=#${getAudioContextId(activeCtx)} state=${activeCtx.state} reason=${reason}`)
        await resume()
      }
    } catch (error) {
      appendAudioDebug(`audio context resume threw ctx=#${getAudioContextId(activeCtx)} state=${activeCtx.state} reason=${reason} error=${formatError(error)}`)
      return null
    }

    if ((activeCtx.state as RecoverableAudioContextState) !== "running") {
      appendAudioDebug(`audio context resume failed ctx=#${getAudioContextId(activeCtx)} finalState=${activeCtx.state} reason=${reason}`)
      return null
    }

    return activeCtx
  }, [getAudioContext])

  const playBeep = useCallback(
    (frequency: number, duration: number, gain: number = 0.3, label = "beep") => {
      const ctx = getAudioContext()
      appendAudioDebug(
        ctx
          ? `beep requested label=${label} freq=${frequency} duration=${duration}s gain=${gain} ctx=#${getAudioContextId(ctx)} state=${ctx.state}`
          : `beep requested label=${label} freq=${frequency} duration=${duration}s gain=${gain} ctx=none`
      )
      if (!ctx) {
        appendAudioDebug(`beep skipped label=${label} reason=no-audio-context`)
        return
      }

      const doPlay = (activeCtx: AudioContext) => {
        try {
          const oscillator = activeCtx.createOscillator()
          const gainNode = activeCtx.createGain()
          const now = activeCtx.currentTime

          oscillator.connect(gainNode)
          gainNode.connect(activeCtx.destination)
          oscillator.frequency.value = frequency
          oscillator.type = "sine"

          gainNode.gain.setValueAtTime(gain, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

          oscillator.start(now)
          oscillator.stop(now + duration)
          appendAudioDebug(`oscillator started label=${label} ctx=#${getAudioContextId(activeCtx)} state=${activeCtx.state} at=${now.toFixed(3)}`)
          oscillator.onended = () => {
            oscillator.disconnect()
            gainNode.disconnect()
          }
        } catch (error) {
          appendAudioDebug(`oscillator failed label=${label} ctx=#${getAudioContextId(activeCtx)} state=${activeCtx.state} error=${formatError(error)}`)
        }
      }

      if ((ctx.state as RecoverableAudioContextState) === "running") {
        doPlay(ctx)
      } else {
        void resumeAudioContext(ctx, `beep:${label}`).then((activeCtx) => {
          if (activeCtx) {
            doPlay(activeCtx)
          } else {
            appendAudioDebug(`beep skipped label=${label} reason=resume-failed`)
          }
        })
      }
    },
    [getAudioContext, resumeAudioContext]
  )

  const playMinuteBeep = useCallback(() => {
    playBeep(880, 0.5, 0.3, "minute")
  }, [playBeep])

  const playCompleteSound = useCallback(() => {
    playBeep(523, 0.15, 0.5, "complete-1")
    setTimeout(() => playBeep(659, 0.15, 0.5, "complete-2"), 150)
    setTimeout(() => playBeep(784, 0.3, 0.5, "complete-3"), 300)
  }, [playBeep])

  const playCountdownTick = useCallback(() => {
    playBeep(660, 0.25, 0.6, "countdown-tick")
  }, [playBeep])

  const playCountdownGo = useCallback(() => {
    playBeep(880, 0.15, 0.3, "countdown-go-1")
    setTimeout(() => playBeep(1100, 0.25, 0.3, "countdown-go-2"), 120)
  }, [playBeep])

  const playExerciseStartChime = useCallback(() => {
    playBeep(784, 0.2, 0.5, "exercise-start-1")
    setTimeout(() => playBeep(988, 0.2, 0.5, "exercise-start-2"), 120)
    setTimeout(() => playBeep(1319, 0.3, 0.5, "exercise-start-3"), 240)
  }, [playBeep])

  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchHandlerRef = useRef<(() => void) | null>(null)
  const visibilityHandlerRef = useRef<(() => void) | null>(null)

  const startKeepalive = useCallback(() => {
    if (keepaliveRef.current) return
    const playSilent = (ctx: AudioContext) => {
      try {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.connect(g)
        g.connect(ctx.destination)
        g.gain.setValueAtTime(0.001, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
        appendAudioDebug(`keepalive silent oscillator started ctx=#${getAudioContextId(ctx)} state=${ctx.state}`)
        osc.onended = () => {
          osc.disconnect()
          g.disconnect()
        }
      } catch (error) {
        appendAudioDebug(`keepalive silent oscillator failed ctx=#${getAudioContextId(ctx)} state=${ctx.state} error=${formatError(error)}`)
      }
    }

    appendAudioDebug("keepalive started")
    keepaliveRef.current = setInterval(() => {
      const ctx = getAudioContext()
      if (!ctx) {
        appendAudioDebug("keepalive tick skipped ctx=none")
        return
      }
      appendAudioDebug(`keepalive tick ctx=#${getAudioContextId(ctx)} state=${ctx.state}`)
      if ((ctx.state as RecoverableAudioContextState) === "running") {
        playSilent(ctx)
      } else {
        void resumeAudioContext(ctx, "keepalive").then((activeCtx) => {
          if (activeCtx) playSilent(activeCtx)
        })
      }
    }, 15000)

    const resumeAudio = () => {
      const ctx = getAudioContext()
      if (ctx && (ctx.state as RecoverableAudioContextState) !== "running") {
        void resumeAudioContext(ctx, "user-input")
      }
    }

    touchHandlerRef.current = resumeAudio
    document.addEventListener("touchstart", resumeAudio, { passive: true })
    document.addEventListener("pointerdown", resumeAudio, { passive: true })
    document.addEventListener("mousedown", resumeAudio, { passive: true })
    document.addEventListener("keydown", resumeAudio)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resumeAudio()
      }
    }
    visibilityHandlerRef.current = handleVisibility
    document.addEventListener("visibilitychange", handleVisibility)
  }, [getAudioContext, resumeAudioContext])

  const stopKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current)
      keepaliveRef.current = null
      appendAudioDebug("keepalive stopped")
    }
    if (touchHandlerRef.current) {
      document.removeEventListener("touchstart", touchHandlerRef.current)
      document.removeEventListener("pointerdown", touchHandlerRef.current)
      document.removeEventListener("mousedown", touchHandlerRef.current)
      document.removeEventListener("keydown", touchHandlerRef.current)
      touchHandlerRef.current = null
    }
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current)
      visibilityHandlerRef.current = null
    }
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const resumeAfterSpeech = () => {
        void resumeAudioContext(undefined, "speech-finished")
      }

      appendAudioDebug(`speech requested text="${compactDebugText(text)}"`)
      if (window.speechSynthesis.speaking) {
        appendAudioDebug("speech cancel before new utterance")
        window.speechSynthesis.cancel()
      }
      const utterance = new SpeechSynthesisUtterance(expandSpeechText(text))
      utterance.rate = 0.9
      utterance.onstart = () => {
        appendAudioDebug(`speech start text="${compactDebugText(text)}"`)
      }
      utterance.onend = () => {
        appendAudioDebug(`speech end text="${compactDebugText(text)}"`)
        resumeAfterSpeech()
        onEnd?.()
      }
      utterance.onerror = (event) => {
        appendAudioDebug(`speech error text="${compactDebugText(text)}" error=${event.error}`)
        resumeAfterSpeech()
      }
      window.speechSynthesis.speak(utterance)
    } else {
      appendAudioDebug(`speech skipped text="${compactDebugText(text)}" reason=speech-synthesis-unavailable`)
    }
  }, [resumeAudioContext])

  const getDebugLog = useCallback(() => formatAudioDebugLog(), [])
  const clearDebugLog = useCallback(() => clearAudioDebugLog(), [])

  return useMemo(() => ({
    playMinuteBeep,
    playCompleteSound,
    playCountdownTick,
    playCountdownGo,
    playExerciseStartChime,
    speak,
    startKeepalive,
    stopKeepalive,
    getDebugLog,
    clearDebugLog,
  }), [playMinuteBeep, playCompleteSound, playCountdownTick, playCountdownGo, playExerciseStartChime, speak, startKeepalive, stopKeepalive, getDebugLog, clearDebugLog])
}
