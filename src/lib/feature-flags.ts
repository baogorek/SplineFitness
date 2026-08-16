export const FEATURES = {
  AUTH_ENABLED: true,
  BOOKING_ENABLED: process.env.NEXT_PUBLIC_ENABLE_BOOKING === "true",
} as const
