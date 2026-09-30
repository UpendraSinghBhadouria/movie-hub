export const BOOKING_CONSTANTS = {
  BOOKING_NUMBER_PREFIX: 'MHB',

  // Small buffer to avoid creating a booking when the
  // Redis lock is about to expire.
  MIN_LOCK_TTL_SECONDS: 10,
} as const;
