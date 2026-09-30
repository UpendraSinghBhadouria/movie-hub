// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import type { Socket } from "socket.io-client";

// import { getLockId } from "@/lib/seatLock";
// import { getSocket } from "@/lib/socket";

// type UseSeatLockParams = {
//   showId: string;
//   selectedSeats: string[];
//   setSelectedSeats: React.Dispatch<React.SetStateAction<string[]>>;
// };

// type SeatLockedPayload = {
//   showId: string;
//   seatIds: string[];
//   lockId: string;
//   expiresIn: number;
// };

// type SeatUnlockedPayload = {
//   showId: string;
//   seatIds: string[];
// };

// type SeatLockFailedPayload = {
//   showId: string;
//   seatIds: string[];
//   lockId: string;
//   message: string;
// };

// type RefreshLockResponse = {
//   success: boolean;
//   seatIds: string[];
//   expiresIn: number;
//   message?: string;
// };

// type LockSeatsResponse = {
//   success: boolean;
//   data?: {
//     showId: string;
//     seatIds: string[];
//     lockId: string;
//     expiresIn: number;
//   };
//   message?: string;
// };

// type CurrentSeatLocksPayload = {
//   showId: string;
//   seats: Array<{
//     seatId: string;
//     locked: boolean;
//     lockId: string | null;
//     ttl: number;
//   }>;
// };

// export function useSeatLock({
//   showId,
//   selectedSeats,
//   setSelectedSeats,
// }: UseSeatLockParams) {
//   const socketRef = useRef<Socket | null>(null);
//   const lockIdRef = useRef<string>(getLockId());

//   const [lockedByOthers, setLockedByOthers] = useState<Set<string>>(new Set());

//   const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);

//   const [remainingSeconds, setRemainingSeconds] = useState(0);

//   const [lockError, setLockError] = useState<string | null>(null);

//   /**
//    * Keep the latest selected seats available to socket/browser events.
//    *
//    * This is useful because `beforeunload` and socket callbacks can otherwise
//    * capture an older value of `selectedSeats`.
//    */
//   const selectedSeatsRef = useRef<string[]>(selectedSeats);

//   useEffect(() => {
//     selectedSeatsRef.current = selectedSeats;
//   }, [showId, selectedSeats]);

//   /**
//    * Socket connection + show room.
//    */
//   useEffect(() => {
//     const socket = getSocket();

//     socketRef.current = socket;

//     const handleCurrentSeatLocks = (payload: CurrentSeatLocksPayload) => {
//       console.log("🔥 CURRENT LOCKS RECEIVED:", payload);

//       if (payload.showId !== showId) {
//         return;
//       }

//       const lockedByOtherUsers = new Set(
//         payload.seats
//           .filter((seat) => seat.locked && seat.lockId !== lockIdRef.current)
//           .map((seat) => seat.seatId),
//       );

//       console.log("🔥 LOCKED BY OTHERS:", [...lockedByOtherUsers]);

//       setLockedByOthers(lockedByOtherUsers);
//     };

//     const handleConnect = () => {
//       socket.emit("join-show", { showId }, (response: unknown) => {
//         // console.log("[SeatLock] join-show response:", response);
//       });
//     };

//     const handleDisconnect = (reason: string) => {
//       // console.log("[SeatLock] socket disconnected:", {
//       //   showId,
//       //   reason,
//       // });
//     };

//     const handleConnectError = (error: Error) => {
//       // console.error("[SeatLock] socket connection error:", {
//       //   showId,
//       //   message: error.message,
//       // });
//     };

//     /**
//      * Register listeners BEFORE connecting/joining.
//      */
//     socket.on("current-seat-locks", handleCurrentSeatLocks);
//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);
//     socket.on("connect_error", handleConnectError);

//     if (!socket.connected) {
//       socket.connect();
//     } else {
//       handleConnect();
//     }

//     return () => {
//       socket.emit("leave-show", { showId });

//       socket.off("current-seat-locks", handleCurrentSeatLocks);
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//       socket.off("connect_error", handleConnectError);

//       socket.disconnect();

//       socketRef.current = null;
//     };
//   }, [showId]);

//   /**
//    * Listen for other users locking/unlocking seats.
//    */
//   useEffect(() => {
//     const socket = socketRef.current;

//     if (!socket) {
//       console.warn("[SeatLock] socket not available for seat events:", {
//         showId,
//       });

//       return;
//     }

//     const handleSeatLocked = (payload: SeatLockedPayload) => {
//       if (payload.showId !== showId) {
//         return;
//       }

//       /**
//        * Ignore our own lock event.
//        */
//       if (payload.lockId === lockIdRef.current) {
//         return;
//       }

//       setLockedByOthers((current) => {
//         const next = new Set(current);

//         payload.seatIds.forEach((seatId) => {
//           next.add(seatId);
//         });

//         return next;
//       });

//       /**
//        * If another user locked one of our selected seats,
//        * remove it from our local selection.
//        */
//       setSelectedSeats((current) => {
//         return current.filter((seatId) => !payload.seatIds.includes(seatId));
//       });
//     };

//     const handleSeatUnlocked = (payload: SeatUnlockedPayload) => {
//       if (payload.showId !== showId) {
//         return;
//       }

//       setLockedByOthers((current) => {
//         const next = new Set(current);

//         payload.seatIds.forEach((seatId) => {
//           next.delete(seatId);
//         });

//         return next;
//       });
//     };

//     socket.on("seat-locked", handleSeatLocked);
//     socket.on("seat-unlocked", handleSeatUnlocked);

//     return () => {
//       socket.off("seat-locked", handleSeatLocked);
//       socket.off("seat-unlocked", handleSeatUnlocked);
//     };
//   }, [showId, setSelectedSeats]);

//   /**
//    * Seat lock failure events.
//    */
//   useEffect(() => {
//     const socket = socketRef.current;

//     if (!socket) {
//       return;
//     }

//     const handleLockFailed = (payload: SeatLockFailedPayload) => {
//       console.error("[SeatLock] seat-lock-failed event:", {
//         showId,
//         payload,
//       });

//       if (payload.showId !== showId) {
//         return;
//       }

//       setLockError(payload.message);

//       setSelectedSeats((current) => {
//         return current.filter((seatId) => !payload.seatIds.includes(seatId));
//       });
//     };

//     socket.on("seat-lock-failed", handleLockFailed);

//     return () => {
//       socket.off("seat-lock-failed", handleLockFailed);
//     };
//   }, [showId, setSelectedSeats]);

//   /**
//    * Lock seats.
//    *
//    * The first successful lock starts the booking deadline.
//    *
//    * Additional seats DO NOT reset the timer.
//    */
//   const lockSeats = useCallback(
//     (seatIds: string[]) => {
//       const socket = socketRef.current;

//       if (!socket || !socket.connected) {
//         console.error("[SeatLock] cannot lock - socket unavailable:", {
//           showId,
//         });

//         setLockError("Connection lost. Please try again.");
//         return;
//       }

//       if (seatIds.length === 0) {
//         console.warn("[SeatLock] cannot lock empty seat list.");
//         return;
//       }

//       setLockError(null);

//       const payload = {
//         showId,
//         seatIds,
//         lockId: lockIdRef.current,
//       };

//       socket.emit("lock-seats", payload, (response: LockSeatsResponse) => {
//         if (!response?.success || !response.data) {
//           console.error("[SeatLock] lock failed:", {
//             request: payload,
//             response,
//           });

//           setLockError(response?.message ?? "Unable to lock selected seats");

//           return;
//         }

//         const lockedSeatIds = response.data.seatIds;

//         /**
//          * Backend lock succeeded.
//          * Now update React state so the UI becomes selected.
//          */
//         setSelectedSeats((current) => {
//           const next = new Set(current);

//           lockedSeatIds.forEach((seatId) => {
//             next.add(seatId);
//           });

//           return Array.from(next);
//         });

//         /**
//          * IMPORTANT:
//          *
//          * Only create the booking deadline when the first seat
//          * is successfully locked.
//          *
//          * Selecting additional seats must NOT reset the timer.
//          */
//         setLockExpiresAt((currentExpiresAt) => {
//           if (currentExpiresAt !== null) {
//             return currentExpiresAt;
//           }

//           return Date.now() + response.data!.expiresIn * 1000;
//         });
//       });
//     },
//     [showId, setSelectedSeats],
//   );

//   /**
//    * Unlock seats.
//    */
//   const unlockSeats = useCallback(
//     (seatIds: string[]) => {
//       const socket = socketRef.current;

//       if (!socket || !socket.connected) {
//         console.warn("[SeatLock] cannot unlock - socket unavailable.");
//         return;
//       }

//       if (seatIds.length === 0) {
//         console.warn("[SeatLock] cannot unlock empty seat list.");
//         return;
//       }

//       const payload = {
//         showId,
//         seatIds,
//         lockId: lockIdRef.current,
//       };

//       socket.emit("unlock-seats", payload);

//       setSelectedSeats((current) => {
//         return current.filter((seatId) => !seatIds.includes(seatId));
//       });

//       /**
//        * IMPORTANT:
//        *
//        * Do not reset the booking timer when removing a seat.
//        *
//        * The timer belongs to the booking session, not an individual seat.
//        */
//     },
//     [showId, setSelectedSeats],
//   );

//   /**
//    * Handle seat click.
//    */
//   const handleSeatClick = useCallback(
//     (seatId: string) => {
//       if (lockedByOthers.has(seatId)) {
//         return;
//       }

//       setLockError(null);

//       if (selectedSeats.includes(seatId)) {
//         unlockSeats([seatId]);
//         return;
//       }

//       const seatsToLock = [...selectedSeats, seatId];

//       lockSeats(seatsToLock);
//     },
//     [lockedByOthers, selectedSeats, lockSeats, unlockSeats],
//   );

//   /**
//    * Refresh lock every 60 seconds.
//    *
//    * IMPORTANT:
//    *
//    * Refreshing the Redis lock must NOT reset the frontend
//    * booking deadline.
//    *
//    * The backend should also preserve the original booking
//    * expiration instead of extending it indefinitely.
//    */
//   useEffect(() => {
//     if (selectedSeats.length === 0 || !lockExpiresAt) {
//       return;
//     }

//     const socket = socketRef.current;

//     if (!socket || !socket.connected) {
//       return;
//     }

//     const refreshLock = () => {
//       const currentSelectedSeats = selectedSeatsRef.current;

//       if (currentSelectedSeats.length === 0) {
//         return;
//       }

//       const remainingMs = lockExpiresAt - Date.now();

//       if (remainingMs <= 0) {
//         return;
//       }

//       const payload = {
//         showId,
//         seatIds: currentSelectedSeats,
//         lockId: lockIdRef.current,
//       };

//       socket.emit("refresh-lock", payload, (response: RefreshLockResponse) => {
//         if (!response?.success) {
//           console.error("[SeatLock] lock refresh failed:", {
//             request: payload,
//             response,
//           });

//           setSelectedSeats([]);
//           setLockExpiresAt(null);
//           setRemainingSeconds(0);
//           setLockError(response?.message ?? "Your seat lock has expired.");

//           return;
//         }

//         /**
//          * IMPORTANT:
//          *
//          * Do NOT do:
//          *
//          * const expiresAt =
//          *   Date.now() + response.expiresIn * 1000;
//          *
//          * The original booking deadline must remain unchanged.
//          */
//       });
//     };

//     const interval = window.setInterval(refreshLock, 60_000);

//     return () => {
//       window.clearInterval(interval);
//     };
//   }, [showId, selectedSeats.length, lockExpiresAt, setSelectedSeats]);

//   /**
//    * Countdown timer.
//    */
//   useEffect(() => {
//     if (!lockExpiresAt) {
//       setRemainingSeconds(0);
//       return;
//     }

//     const updateRemainingTime = () => {
//       const remaining = Math.max(
//         0,
//         Math.ceil((lockExpiresAt - Date.now()) / 1000),
//       );

//       setRemainingSeconds(remaining);

//       if (remaining === 0) {
//         setSelectedSeats([]);
//         setLockExpiresAt(null);
//         setRemainingSeconds(0);
//         setLockError("Your seat selection has expired.");
//       }
//     };

//     /**
//      * Update immediately so the timer doesn't wait
//      * one second before showing the correct value.
//      */
//     updateRemainingTime();

//     const interval = window.setInterval(updateRemainingTime, 1000);

//     return () => {
//       window.clearInterval(interval);
//     };
//   }, [lockExpiresAt, setSelectedSeats]);

//   /**
//    * Release locks when browser/tab is closed or refreshed.
//    */
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       const socket = socketRef.current;
//       const currentSelectedSeats = selectedSeatsRef.current;

//       if (!socket || !socket.connected || currentSelectedSeats.length === 0) {
//         return;
//       }

//       const payload = {
//         showId,
//         seatIds: currentSelectedSeats,
//         lockId: lockIdRef.current,
//       };

//       socket.emit("unlock-seats", payload);
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);

//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, [showId]);

//   return {
//     lockedByOthers,
//     lockExpiresAt,
//     remainingSeconds,
//     lockError,
//     handleSeatClick,
//     lockSeats,
//     unlockSeats,
//   };
// }

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

  const [remainingSeconds, setRemainingSeconds] = useState(0);

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
   * Socket connection + show room.
   */
  useEffect(() => {
    const socket = getSocket();

    socketRef.current = socket;

    const handleCurrentSeatLocks = (payload: CurrentSeatLocksPayload) => {
      console.log("🔥 CURRENT LOCKS RECEIVED:", payload);

      if (payload.showId !== showId) {
        return;
      }

      const lockedByOtherUsers = new Set(
        payload.seats
          .filter((seat) => seat.locked && seat.lockId !== lockIdRef.current)
          .map((seat) => seat.seatId),
      );

      console.log("🔥 LOCKED BY OTHERS:", [...lockedByOtherUsers]);

      setLockedByOthers(lockedByOtherUsers);
    };

    const handleConnect = () => {
      console.log("[SeatLock] socket connected:", {
        showId,
        socketId: socket.id,
      });

      socket.emit("join-show", { showId }, (response: unknown) => {
        console.log("[SeatLock] joined show:", {
          showId,
          response,
        });
      });
    };

    const handleDisconnect = (reason: string) => {
      console.log("[SeatLock] socket disconnected:", {
        showId,
        reason,
      });
    };

    const handleConnectError = (error: Error) => {
      console.error("[SeatLock] socket connection error:", {
        showId,
        message: error.message,
      });
    };

    /**
     * Register listeners BEFORE connecting/joining.
     */
    socket.on("current-seat-locks", handleCurrentSeatLocks);

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", handleConnectError);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      /**
       * Leave this show's room.
       *
       * IMPORTANT:
       *
       * We intentionally do NOT call socket.disconnect().
       *
       * The socket is shared globally and must survive navigation
       * from seat-layout -> checkout.
       */
      socket.emit("leave-show", {
        showId,
      });

      socket.off("current-seat-locks", handleCurrentSeatLocks);

      socket.off("connect", handleConnect);

      socket.off("disconnect", handleDisconnect);

      socket.off("connect_error", handleConnectError);

      /**
       * Do NOT:
       *
       * socket.disconnect();
       */

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
      if (payload.showId !== showId) {
        return;
      }

      /**
       * Ignore our own lock event.
       */
      if (payload.lockId === lockIdRef.current) {
        return;
      }

      setLockedByOthers((current) => {
        const next = new Set(current);

        payload.seatIds.forEach((seatId) => {
          next.add(seatId);
        });

        return next;
      });

      /**
       * If another user locked one of our selected seats,
       * remove it from our local selection.
       */
      setSelectedSeats((current) => {
        return current.filter((seatId) => !payload.seatIds.includes(seatId));
      });
    };

    const handleSeatUnlocked = (payload: SeatUnlockedPayload) => {
      if (payload.showId !== showId) {
        return;
      }

      setLockedByOthers((current) => {
        const next = new Set(current);

        payload.seatIds.forEach((seatId) => {
          next.delete(seatId);
        });

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
        return;
      }

      setLockError(payload.message);

      setSelectedSeats((current) => {
        return current.filter((seatId) => !payload.seatIds.includes(seatId));
      });
    };

    socket.on("seat-lock-failed", handleLockFailed);

    return () => {
      socket.off("seat-lock-failed", handleLockFailed);
    };
  }, [showId, setSelectedSeats]);

  /**
   * Lock seats.
   *
   * The first successful lock starts the booking deadline.
   *
   * Additional seats DO NOT reset the timer.
   */
  const lockSeats = useCallback(
    (seatIds: string[]) => {
      const socket = socketRef.current;

      if (!socket || !socket.connected) {
        console.error("[SeatLock] cannot lock - socket unavailable:", {
          showId,
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

      socket.emit("lock-seats", payload, (response: LockSeatsResponse) => {
        if (!response?.success || !response.data) {
          console.error("[SeatLock] lock failed:", {
            request: payload,
            response,
          });

          setLockError(response?.message ?? "Unable to lock selected seats");

          return;
        }

        const lockedSeatIds = response.data.seatIds;

        /**
         * Backend lock succeeded.
         * Now update React state so the UI becomes selected.
         */
        setSelectedSeats((current) => {
          const next = new Set(current);

          lockedSeatIds.forEach((seatId) => {
            next.add(seatId);
          });

          return Array.from(next);
        });

        /**
         * IMPORTANT:
         *
         * Only create the booking deadline when the first seat
         * is successfully locked.
         *
         * Selecting additional seats must NOT reset the timer.
         */
        setLockExpiresAt((currentExpiresAt) => {
          if (currentExpiresAt !== null) {
            return currentExpiresAt;
          }

          return Date.now() + response.data!.expiresIn * 1000;
        });
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

      socket.emit("unlock-seats", payload);

      setSelectedSeats((current) => {
        return current.filter((seatId) => !seatIds.includes(seatId));
      });
    },
    [showId, setSelectedSeats],
  );

  /**
   * Handle seat click.
   */
  const handleSeatClick = useCallback(
    (seatId: string) => {
      if (lockedByOthers.has(seatId)) {
        return;
      }

      setLockError(null);

      if (selectedSeats.includes(seatId)) {
        unlockSeats([seatId]);

        return;
      }

      const seatsToLock = [...selectedSeats, seatId];

      lockSeats(seatsToLock);
    },
    [lockedByOthers, selectedSeats, lockSeats, unlockSeats],
  );

  /**
   * Refresh lock every 60 seconds.
   *
   * IMPORTANT:
   *
   * Refreshing the Redis lock must NOT reset the frontend
   * booking deadline.
   *
   * The backend should also preserve the original booking
   * expiration instead of extending it indefinitely.
   */
  useEffect(() => {
    if (selectedSeats.length === 0 || !lockExpiresAt) {
      return;
    }

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      return;
    }

    const refreshLock = () => {
      const currentSelectedSeats = selectedSeatsRef.current;

      if (currentSelectedSeats.length === 0) {
        return;
      }

      const remainingMs = lockExpiresAt - Date.now();

      if (remainingMs <= 0) {
        return;
      }

      const payload = {
        showId,
        seatIds: currentSelectedSeats,
        lockId: lockIdRef.current,
      };

      socket.emit("refresh-lock", payload, (response: RefreshLockResponse) => {
        if (!response?.success) {
          console.error("[SeatLock] lock refresh failed:", {
            request: payload,
            response,
          });

          setSelectedSeats([]);
          setLockExpiresAt(null);
          setRemainingSeconds(0);
          setLockError(response?.message ?? "Your seat lock has expired.");
        }
      });
    };

    const interval = window.setInterval(refreshLock, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [showId, selectedSeats.length, lockExpiresAt, setSelectedSeats]);

  /**
   * Countdown timer.
   */
  useEffect(() => {
    if (!lockExpiresAt) {
      setRemainingSeconds(0);

      return;
    }

    const updateRemainingTime = () => {
      const remaining = Math.max(
        0,
        Math.ceil((lockExpiresAt - Date.now()) / 1000),
      );

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setSelectedSeats([]);
        setLockExpiresAt(null);
        setRemainingSeconds(0);
        setLockError("Your seat selection has expired.");
      }
    };

    updateRemainingTime();

    const interval = window.setInterval(updateRemainingTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [lockExpiresAt, setSelectedSeats]);

  /**
   * Release locks when browser/tab is closed or refreshed.
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      const socket = socketRef.current;

      const currentSelectedSeats = selectedSeatsRef.current;

      if (!socket || !socket.connected || currentSelectedSeats.length === 0) {
        return;
      }

      const payload = {
        showId,
        seatIds: currentSelectedSeats,
        lockId: lockIdRef.current,
      };

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
