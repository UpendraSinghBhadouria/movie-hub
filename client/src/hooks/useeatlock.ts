"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { getLockId } from "@/lib/seatLock";
import { getSocket } from "@/lib/socket";

type UseSeatLockParams = {
  showId: string;
  selectedSeats: string[];
  setSelectedSeats: React.Dispatch<React.SetStateAction<string[]>>;
};

type SeatLockedPayload = {
  showId: string;
  seatIds: string[];
  lockId: string;
  expiresIn: number;
};

type SeatUnlockedPayload = {
  showId: string;
  seatIds: string[];
};

type SeatLockFailedPayload = {
  showId: string;
  seatIds: string[];
  lockId: string;
  message: string;
};

type RefreshLockResponse = {
  success: boolean;
  seatIds: string[];
  expiresIn: number;
  message?: string;
};

type LockSeatsResponse = {
  success: boolean;
  data?: {
    showId: string;
    seatIds: string[];
    lockId: string;
    expiresIn: number;
  };
  message?: string;
};

type CurrentSeatLocksPayload = {
  showId: string;
  seats: Array<{
    seatId: string;
    locked: boolean;
    lockId: string | null;
    ttl: number;
  }>;
};

export function useSeatLock({
  showId,
  selectedSeats,
  setSelectedSeats,
}: UseSeatLockParams) {
  const socketRef = useRef<Socket | null>(null);
  const lockIdRef = useRef<string>(getLockId());

  const [lockedByOthers, setLockedByOthers] = useState<Set<string>>(new Set());
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [lockError, setLockError] = useState<string | null>(null);

  /**
   * Keep the latest selected seats available to socket/browser events.
   *
   * This is useful because `beforeunload` and socket callbacks can otherwise
   * capture an older value of `selectedSeats`.
   */
  const selectedSeatsRef = useRef<string[]>(selectedSeats);

  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [showId, selectedSeats]);

  /**
   * Generate one lock ID for this browser/session.
   *
   * The same lock ID is used when:
   * - locking seats
   * - refreshing the lock
   * - unlocking seats
   */

  /**
   * Socket connection + show room.
   */
  useEffect(() => {
    const socket = getSocket();

    socketRef.current = socket;

    // console.log("[SeatLock] socket setup:", {
    //   showId,
    //   socketId: socket.id,
    //   connected: socket.connected,
    //   lockId: lockIdRef.current,
    // });re the listener has been registered.

    const handleCurrentSeatLocks = (payload: CurrentSeatLocksPayload) => {
      console.log("🔥 CURRENT LOCKS RECEIVED:", payload);

      const lockedByOtherUsers = new Set(
        payload.seats
          .filter((seat) => seat.locked && seat.lockId !== lockIdRef.current)
          .map((seat) => seat.seatId),
      );

      console.log("🔥 LOCKED BY OTHERS:", [...lockedByOtherUsers]);

      setLockedByOthers(lockedByOtherUsers);
    };
    const handleConnect = () => {
      socket.emit("join-show", { showId }, (response: unknown) => {
        // console.log("[SeatLock] join-show response:", {
        //   showId,
        //   socketId: socket.id,
        //   response,
        // });
      });
    };

    const handleDisconnect = (reason: string) => {
      //   console.log("[SeatLock] socket disconnected:", {
      //     showId,
      //     socketId: socket.id,
      //     reason,
      //   });
    };

    const handleConnectError = (error: Error) => {
      //   console.error("[SeatLock] socket connection error:", {
      //     showId,
      //     message: error.message,
      //     error,
      //   });
    };

    /**
     * Register listeners BEFORE connecting/joining.
     */
    socket.on("current-seat-locks", handleCurrentSeatLocks);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (!socket.connected) {
      //   console.log("[SeatLock] connecting socket...");
      socket.connect();
    } else {
      //   console.log("[SeatLock] socket already connected, joining show...");

      handleConnect();
    }

    return () => {
      //   console.log("[SeatLock] leaving show:", {
      //     showId,
      //     socketId: socket.id,
      //   });

      socket.emit("leave-show", { showId });

      socket.off("current-seat-locks", handleCurrentSeatLocks);

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      // socket.disconnect();

      socketRef.current = null;
    };
  }, [showId]);

  /**
   * Listen for other users locking/unlocking seats.
   */
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) {
      console.warn("[SeatLock] socket not available for seat events:", {
        showId,
      });

      return;
    }

    const handleSeatLocked = (payload: SeatLockedPayload) => {
      //   console.log("[SeatLock] seat-locked event received:", {
      //     showId,
      //     payload,
      //     myLockId: lockIdRef.current,
      //   });

      if (payload.showId !== showId) {
        // console.log("[SeatLock] ignoring seat-locked event for another show:", {
        //   expectedShowId: showId,
        //   receivedShowId: payload.showId,
        // });

        return;
      }

      /**
       * Ignore our own lock event.
       *
       * Backend sends `seat-locked` to other clients using `client.to(room)`,
       * but keeping this check makes the client safer.
       */
      if (payload.lockId === lockIdRef.current) {
        // console.log("[SeatLock] ignoring own seat-locked event:", {
        //   seatIds: payload.seatIds,
        //   lockId: payload.lockId,
        // });

        return;
      }

      setLockedByOthers((current) => {
        const next = new Set(current);

        payload.seatIds.forEach((seatId) => {
          next.add(seatId);
        });

        // console.log("[SeatLock] lockedByOthers updated:", {
        //   previous: Array.from(current),
        //   added: payload.seatIds,
        //   next: Array.from(next),
        // });

        return next;
      });

      /**
       * If another user locked one of our selected seats,
       * remove it from our local selection.
       */
      setSelectedSeats((current) => {
        const next = current.filter(
          (seatId) => !payload.seatIds.includes(seatId),
        );

        if (next.length !== current.length) {
          //   console.log("[SeatLock] removed seats locked by another user:", {
          //     previous: current,
          //     removed: payload.seatIds,
          //     next,
          //   });
        }

        return next;
      });
    };

    const handleSeatUnlocked = (payload: SeatUnlockedPayload) => {
      //   console.log("[SeatLock] seat-unlocked event received:", {
      //     showId,
      //     payload,
      //   });

      if (payload.showId !== showId) {
        // console.log(
        //   "[SeatLock] ignoring seat-unlocked event for another show:",
        //   {
        //     expectedShowId: showId,
        //     receivedShowId: payload.showId,
        //   },
        // );

        return;
      }

      setLockedByOthers((current) => {
        const next = new Set(current);

        payload.seatIds.forEach((seatId) => {
          next.delete(seatId);
        });

        // console.log("[SeatLock] lockedByOthers after unlock:", {
        //   previous: Array.from(current),
        //   removed: payload.seatIds,
        //   next: Array.from(next),
        // });

        return next;
      });
    };

    socket.on("seat-locked", handleSeatLocked);
    socket.on("seat-unlocked", handleSeatUnlocked);

    return () => {
      socket.off("seat-locked", handleSeatLocked);
      socket.off("seat-unlocked", handleSeatUnlocked);
    };
  }, [showId, setSelectedSeats]);

  /**
   * Seat lock failure events.
   */
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    const handleLockFailed = (payload: SeatLockFailedPayload) => {
      console.error("[SeatLock] seat-lock-failed event:", {
        showId,
        payload,
      });

      if (payload.showId !== showId) {
        // console.log("[SeatLock] ignoring failure for another show:", {
        //   expectedShowId: showId,
        //   receivedShowId: payload.showId,
        // });

        return;
      }

      setLockError(payload.message);

      setSelectedSeats((current) => {
        const next = current.filter(
          (seatId) => !payload.seatIds.includes(seatId),
        );

        // console.log("[SeatLock] selection after lock failure:", {
        //   previous: current,
        //   failedSeats: payload.seatIds,
        //   next,
        // });

        return next;
      });
    };

    socket.on("seat-lock-failed", handleLockFailed);

    return () => {
      socket.off("seat-lock-failed", handleLockFailed);
    };
  }, [showId, setSelectedSeats]);

  /**
   * Lock seats.
   */
  const lockSeats = useCallback(
    (seatIds: string[]) => {
      const socket = socketRef.current;

      //   console.log("[SeatLock] lockSeats called:", {
      //     showId,
      //     seatIds,
      //     selectedSeatsBeforeLock: selectedSeatsRef.current,
      //     lockId: lockIdRef.current,
      //     socketId: socket?.id,
      //     socketConnected: socket?.connected,
      //   });

      if (!socket || !socket.connected) {
        console.error("[SeatLock] cannot lock - socket unavailable:", {
          showId,
          socketExists: Boolean(socket),
          socketConnected: socket?.connected,
        });

        setLockError("Connection lost. Please try again.");
        return;
      }

      if (seatIds.length === 0) {
        console.warn("[SeatLock] cannot lock empty seat list.");
        return;
      }

      setLockError(null);

      const payload = {
        showId,
        seatIds,
        lockId: lockIdRef.current,
      };

      //   console.log("[SeatLock] emitting lock-seats:", payload);

      socket.emit("lock-seats", payload, (response: LockSeatsResponse) => {
        // console.log("[SeatLock] lock response:", {
        //   request: payload,
        //   response,
        // });

        if (!response?.success || !response.data) {
          console.error("[SeatLock] lock failed:", {
            request: payload,
            response,
          });

          setLockError(response?.message ?? "Unable to lock selected seats");

          return;
        }

        const lockedSeatIds = response.data.seatIds;

        // console.log("[SeatLock] lock successful:", {
        //   showId: response.data.showId,
        //   seatIds: lockedSeatIds,
        //   lockId: response.data.lockId,
        //   expiresIn: response.data.expiresIn,
        // });

        /**
         * IMPORTANT:
         *
         * Backend lock succeeded.
         * Now update React state so the UI becomes selected.
         */
        setSelectedSeats((current) => {
          const next = new Set(current);

          lockedSeatIds.forEach((seatId) => {
            next.add(seatId);
          });

          const nextArray = Array.from(next);

          //   console.log("[SeatLock] updating selectedSeats after success:", {
          //     previous: current,
          //     lockedSeatIds,
          //     next: nextArray,
          //   });

          return nextArray;
        });

        const expiresAt = Date.now() + response.data.expiresIn * 1000;

        setLockExpiresAt(expiresAt);
        setRemainingSeconds(response.data.expiresIn);

        // console.log("[SeatLock] lock timer started:", {
        //   expiresIn: response.data.expiresIn,
        //   expiresAt: new Date(expiresAt).toISOString(),
        // });
      });
    },
    [showId, setSelectedSeats],
  );

  /**
   * Unlock seats.
   */
  const unlockSeats = useCallback(
    (seatIds: string[]) => {
      const socket = socketRef.current;

      //   console.log("[SeatLock] unlockSeats called:", {
      //     showId,
      //     seatIds,
      //     lockId: lockIdRef.current,
      //     socketId: socket?.id,
      //     socketConnected: socket?.connected,
      //   });

      if (!socket || !socket.connected) {
        console.warn("[SeatLock] cannot unlock - socket unavailable.");
        return;
      }

      if (seatIds.length === 0) {
        console.warn("[SeatLock] cannot unlock empty seat list.");
        return;
      }

      const payload = {
        showId,
        seatIds,
        lockId: lockIdRef.current,
      };

      //   console.log("[SeatLock] emitting unlock-seats:", payload);

      socket.emit("unlock-seats", payload);

      setSelectedSeats((current) => {
        const next = current.filter((seatId) => !seatIds.includes(seatId));

        // console.log("[SeatLock] selection after local unlock:", {
        //   previous: current,
        //   unlockedSeats: seatIds,
        //   next,
        // });

        return next;
      });
    },
    [showId, setSelectedSeats],
  );

  /**
   * Handle seat click.
   */
  const handleSeatClick = useCallback(
    (seatId: string) => {
      //   console.log("[SeatLock] seat clicked:", {
      //     showId,
      //     seatId,
      //     selectedSeats: selectedSeatsRef.current,
      //     lockedByOthers: Array.from(lockedByOthers),
      //   });

      if (lockedByOthers.has(seatId)) {
        // console.log("[SeatLock] click ignored - seat locked by another user:", {
        //   seatId,
        // });

        return;
      }

      setLockError(null);

      if (selectedSeats.includes(seatId)) {
        // console.log("[SeatLock] seat already selected - unlocking:", {
        //   seatId,
        // });

        unlockSeats([seatId]);
        return;
      }

      const seatsToLock = [...selectedSeats, seatId];

      //   console.log("[SeatLock] seat not selected - locking:", {
      //     currentSelectedSeats: selectedSeats,
      //     seatToAdd: seatId,
      //     seatsToLock,
      //   });

      lockSeats(seatsToLock);
    },
    [showId, lockedByOthers, selectedSeats, lockSeats, unlockSeats],
  );

  /**
   * Refresh lock every 60 seconds.
   */
  useEffect(() => {
    if (selectedSeats.length === 0) {
      //   console.log("[SeatLock] no selected seats - refresh timer disabled.");

      setLockExpiresAt(null);
      return;
    }

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      //   console.warn("[SeatLock] refresh timer skipped - socket unavailable:", {
      //     showId,
      //     selectedSeats,
      //   });

      return;
    }

    const refreshLock = () => {
      const currentSelectedSeats = selectedSeatsRef.current;

      if (currentSelectedSeats.length === 0) {
        // console.log("[SeatLock] refresh skipped - no selected seats.");
        return;
      }

      const payload = {
        showId,
        seatIds: currentSelectedSeats,
        lockId: lockIdRef.current,
      };

      //   console.log("[SeatLock] refreshing lock:", payload);

      socket.emit("refresh-lock", payload, (response: RefreshLockResponse) => {
        // console.log("[SeatLock] refresh response:", {
        //   request: payload,
        //   response,
        // });

        if (!response?.success) {
          console.error("[SeatLock] lock refresh failed:", {
            request: payload,
            response,
          });

          setSelectedSeats([]);
          setLockExpiresAt(null);
          setRemainingSeconds(0);
          setLockError(response?.message ?? "Your seat lock has expired.");

          return;
        }

        const expiresAt = Date.now() + response.expiresIn * 1000;

        setLockExpiresAt(expiresAt);
        setRemainingSeconds(response.expiresIn);

        // console.log("[SeatLock] lock refreshed:", {
        //   seatIds: response.seatIds,
        //   expiresIn: response.expiresIn,
        //   expiresAt: new Date(expiresAt).toISOString(),
        // });
      });
    };

    // console.log("[SeatLock] starting 60-second refresh timer:", {
    //   showId,
    //   selectedSeats,
    // });

    const interval = window.setInterval(refreshLock, 60_000);

    return () => {
      //   console.log("[SeatLock] stopping refresh timer:", {
      //     showId,
      //   });

      window.clearInterval(interval);
    };
  }, [showId, selectedSeats, setSelectedSeats]);

  /**
   * Countdown timer.
   */
  useEffect(() => {
    if (!lockExpiresAt) {
      return;
    }

    // console.log("[SeatLock] countdown started:", {
    //   showId,
    //   expiresAt: new Date(lockExpiresAt).toISOString(),
    // });

    const interval = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((lockExpiresAt - Date.now()) / 1000),
      );

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        // console.warn("[SeatLock] lock expired:", {
        //   showId,
        //   selectedSeats: selectedSeatsRef.current,
        // });

        setSelectedSeats([]);
        setLockExpiresAt(null);
        setRemainingSeconds(0);
        setLockError("Your seat selection has expired.");
      }
    }, 1000);

    return () => {
      //   console.log("[SeatLock] countdown stopped:", {
      //     showId,
      //   });

      window.clearInterval(interval);
    };
  }, [showId, lockExpiresAt, setSelectedSeats]);

  /**
   * Release locks when browser/tab is closed or refreshed.
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      const socket = socketRef.current;
      const currentSelectedSeats = selectedSeatsRef.current;

      //   console.log("[SeatLock] beforeunload:", {
      //     showId,
      //     selectedSeats: currentSelectedSeats,
      //     socketConnected: socket?.connected,
      //   });

      if (!socket || !socket.connected || currentSelectedSeats.length === 0) {
        return;
      }

      const payload = {
        showId,
        seatIds: currentSelectedSeats,
        lockId: lockIdRef.current,
      };

      //   console.log("[SeatLock] releasing seats before unload:", payload);

      socket.emit("unlock-seats", payload);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showId]);

  return {
    lockedByOthers,
    lockExpiresAt,
    remainingSeconds,
    lockError,
    handleSeatClick,
    lockSeats,
    unlockSeats,
  };
}
