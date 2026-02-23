"use client"

import { useCallback, useRef } from "react"

function expandSpeechText(text: string): string {
  return text
    .replace(/^Alt\.\s/g, "Alternating ")
    .replace(/\bBW\b/g, "Bodyweight")
    .replace(/\b1 1\/2\b/g, "One and a Half")
    .replace(/\bVO2\b/g, "V O 2")
    .replace(/\bATP-PCr\b/g, "A T P phosphocreatine")
}

export function estimateSpeechSeconds(text: string): number {
  const expanded = expandSpeechText(text)
  const wordCount = expanded.split(/\s+/).filter(w => w.length > 0).length
  return Math.ceil(wordCount / 2)
}

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass()
      }
    }
    return audioContextRef.current
  }, [])

  const playBeep = useCallback(
    (frequency: number, duration: number, gain: number = 0.3) => {
      const ctx = getAudioContext()
      if (!ctx) return

      const doPlay = () => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        oscillator.frequency.value = frequency
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(gain, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

        oscillator.start()
        oscillator.stop(ctx.currentTime + duration)
      }

      if (ctx.state === "suspended") {
        ctx.resume().then(doPlay)
      } else {
        doPlay()
      }
    },
    [getAudioContext]
  )

  const playMinuteBeep = useCallback(() => {
    playBeep(880, 0.5)
  }, [playBeep])

  const playCompleteSound = useCallback(() => {
    playBeep(523, 0.15, 0.5)
    setTimeout(() => playBeep(659, 0.15, 0.5), 150)
    setTimeout(() => playBeep(784, 0.3, 0.5), 300)
  }, [playBeep])

  const playCountdownTick = useCallback(() => {
    playBeep(660, 0.25, 0.6)
  }, [playBeep])

  const playCountdownGo = useCallback(() => {
    playBeep(880, 0.15)
    setTimeout(() => playBeep(1100, 0.25), 120)
  }, [playBeep])

  const playExerciseStartChime = useCallback(() => {
    playBeep(784, 0.2, 0.5)
    setTimeout(() => playBeep(988, 0.2, 0.5), 120)
    setTimeout(() => playBeep(1319, 0.3, 0.5), 240)
  }, [playBeep])

  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchHandlerRef = useRef<(() => void) | null>(null)
  const visibilityHandlerRef = useRef<(() => void) | null>(null)

  const startKeepalive = useCallback(() => {
    if (keepaliveRef.current) return
    keepaliveRef.current = setInterval(() => {
      const ctx = getAudioContext()
      if (!ctx) return
      if (ctx.state === "suspended") {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.001, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    }, 15000)

    const resumeAudio = () => {
      const ctx = getAudioContext()
      if (ctx && ctx.state === "suspended") {
        ctx.resume()
      }
    }

    touchHandlerRef.current = resumeAudio
    document.addEventListener("touchstart", resumeAudio, { passive: true })

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        resumeAudio()
      }
    }
    visibilityHandlerRef.current = handleVisibility
    document.addEventListener("visibilitychange", handleVisibility)
  }, [getAudioContext])

  const stopKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current)
      keepaliveRef.current = null
    }
    if (touchHandlerRef.current) {
      document.removeEventListener("touchstart", touchHandlerRef.current)
      touchHandlerRef.current = null
    }
    if (visibilityHandlerRef.current) {
      document.removeEventListener("visibilitychange", visibilityHandlerRef.current)
      visibilityHandlerRef.current = null
    }
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      const utterance = new SpeechSynthesisUtterance(expandSpeechText(text))
      utterance.rate = 0.9
      if (onEnd) {
        utterance.onend = () => onEnd()
      }
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  return {
    playMinuteBeep,
    playCompleteSound,
    playCountdownTick,
    playCountdownGo,
    playExerciseStartChime,
    speak,
    startKeepalive,
    stopKeepalive,
  }
}
