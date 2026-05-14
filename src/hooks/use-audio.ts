"use client"

import { useCallback, useMemo, useRef } from "react"

type RecoverableAudioContextState = AudioContextState | "interrupted"

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
    if (forceNew && audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass()
      }
    }
    return audioContextRef.current
  }, [])

  const resumeAudioContext = useCallback(async (ctx = getAudioContext()) => {
    if (!ctx) return null

    if (ctx.state === "closed") {
      ctx = getAudioContext(true)
      if (!ctx) return null
    }

    const resume = async () => {
      if ((ctx.state as RecoverableAudioContextState) !== "running") {
        await ctx.resume()
      }
    }

    try {
      await resume()
      if ((ctx.state as RecoverableAudioContextState) !== "running") {
        await new Promise(resolve => setTimeout(resolve, 50))
        await resume()
      }
    } catch {
      return null
    }

    return (ctx.state as RecoverableAudioContextState) === "running" ? ctx : null
  }, [getAudioContext])

  const playBeep = useCallback(
    (frequency: number, duration: number, gain: number = 0.3) => {
      const ctx = getAudioContext()
      if (!ctx) return

      const doPlay = (activeCtx: AudioContext) => {
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
        oscillator.onended = () => {
          oscillator.disconnect()
          gainNode.disconnect()
        }
      }

      if ((ctx.state as RecoverableAudioContextState) === "running") {
        doPlay(ctx)
      } else {
        void resumeAudioContext(ctx).then((activeCtx) => {
          if (activeCtx) doPlay(activeCtx)
        })
      }
    },
    [getAudioContext, resumeAudioContext]
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
    const playSilent = (ctx: AudioContext) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      g.gain.setValueAtTime(0.001, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
      osc.onended = () => {
        osc.disconnect()
        g.disconnect()
      }
    }

    keepaliveRef.current = setInterval(() => {
      const ctx = getAudioContext()
      if (!ctx) return
      if ((ctx.state as RecoverableAudioContextState) === "running") {
        playSilent(ctx)
      } else {
        void resumeAudioContext(ctx).then((activeCtx) => {
          if (activeCtx) playSilent(activeCtx)
        })
      }
    }, 15000)

    const resumeAudio = () => {
      const ctx = getAudioContext()
      if (ctx && (ctx.state as RecoverableAudioContextState) !== "running") {
        void resumeAudioContext(ctx)
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
        void resumeAudioContext()
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      const utterance = new SpeechSynthesisUtterance(expandSpeechText(text))
      utterance.rate = 0.9
      utterance.onend = () => {
        resumeAfterSpeech()
        onEnd?.()
      }
      utterance.onerror = resumeAfterSpeech
      window.speechSynthesis.speak(utterance)
    }
  }, [resumeAudioContext])

  return useMemo(() => ({
    playMinuteBeep,
    playCompleteSound,
    playCountdownTick,
    playCountdownGo,
    playExerciseStartChime,
    speak,
    startKeepalive,
    stopKeepalive,
  }), [playMinuteBeep, playCompleteSound, playCountdownTick, playCountdownGo, playExerciseStartChime, speak, startKeepalive, stopKeepalive])
}
