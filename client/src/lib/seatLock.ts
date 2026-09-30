const LOCK_ID_KEY = "movie-booking-lock-id";

export const getLockId = (): string => {
  const existingLockId = sessionStorage.getItem(LOCK_ID_KEY);

  if (existingLockId) {
    return existingLockId;
  }

  const lockId = crypto.randomUUID();

  sessionStorage.setItem(LOCK_ID_KEY, lockId);

  return lockId;
};

export const clearLockId = (): void => {
  sessionStorage.removeItem(LOCK_ID_KEY);
};
