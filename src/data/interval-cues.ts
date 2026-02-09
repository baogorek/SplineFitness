import { IntervalSpeechCue } from "@/types/workout"

export const INTERVAL_SPEECH_CUES: IntervalSpeechCue[] = [
  {
    elapsedSeconds: 0,
    text: "Interval active. Phosphagen system is the primary energy source.",
  },
  {
    elapsedSeconds: 15,
    text: "Phosphocreatine effectively depleted. Fast glycolysis is now the dominant energy source.",
  },
  {
    elapsedSeconds: 75,
    text: "Hydrogen ions accumulating. Bicarbonate buffering is increasing ventilation to clear carbon dioxide.",
  },
  {
    elapsedSeconds: 120,
    text: "Oxidative system approaching VO2 max. Fast glycolysis still required above lactate threshold.",
  },
  {
    elapsedSeconds: 180,
    text: "Type 1 fibers fatiguing. Size principle is driving recruitment of Type 2 motor units.",
  },
  {
    elapsedSeconds: 225,
    text: "Peripheral fatigue is high. Neural drive must increase to overcome metabolic inhibition.",
  },
]

export const INTERVAL_COMPLETE_CUE =
  "Interval complete. Fast component of EPOC active: prioritizing ATP-PCr resynthesis and myoglobin reoxygenation."

export const INTERVAL_DURATION_SECONDS = 240
export const TOTAL_SETS = 4
