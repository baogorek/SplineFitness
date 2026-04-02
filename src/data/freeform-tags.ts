export const FREEFORM_TAGS = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "EZ bar",
  "cable",
  "machine",
  "smith machine",
  "jones machine",
  "bodyweight",
  "band",
  "TRX",
  "unilateral",
  "isometric",
] as const

export type FreeformTag = (typeof FREEFORM_TAGS)[number]
