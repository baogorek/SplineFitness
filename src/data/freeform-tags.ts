export const FREEFORM_TAGS = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "cable",
  "machine",
  "bodyweight",
  "band",
] as const

export type FreeformTag = (typeof FREEFORM_TAGS)[number]
