"use client"

import { useCallback, useRef } from "react"

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
    (frequency: number, duration: number) => {
      const ctx = getAudioContext()
      if (!ctx) return

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start()
      oscillator.stop(ctx.currentTime + duration)
    },
    [getAudioContext]
  )

  const playMinuteBeep = useCallback(() => {
    playBeep(880, 0.5)
  }, [playBeep])

  const playCompleteSound = useCallback(() => {
    playBeep(523, 0.15)
    setTimeout(() => playBeep(659, 0.15), 150)
    setTimeout(() => playBeep(784, 0.3), 300)
  }, [playBeep])

  return {
    playMinuteBeep,
    playCompleteSound,
  }
}
