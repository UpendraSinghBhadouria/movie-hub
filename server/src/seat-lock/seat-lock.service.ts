// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { RedisService } from '../redis/redis.service.js';
// import { PrismaService } from '../prisma/prisma.service.js';

// type LockSeatsResult = {
//   success: boolean;
//   showId: string;
//   seatIds: string[];
//   lockId: string;
//   expiresIn: number;
// };

// type LockStatus = {
//   seatId: string;
//   locked: boolean;
//   lockId: string | null;
//   ttl: number;
// };

// @Injectable()
// export class SeatLockService {
//   private readonly LOCK_TTL_SECONDS = 5 * 60;

//   constructor(
//     private readonly redisService: RedisService,
//     private readonly prisma: PrismaService,
//   ) {}

//   private getSeatKey(showId: string, seatId: string): string {
//     return `show:{${showId}}:seat:${seatId}`;
//   }

//   private getSeatKeys(showId: string, seatIds: string[]): string[] {
//     return seatIds.map((seatId) => this.getSeatKey(showId, seatId));
//   }

//   /**
//    * Atomically locks all requested seats.
//    *
//    * Returns:
//    * 1  -> all seats successfully locked
//    * 0  -> at least one seat is already locked
//    */
//   async lockSeats(
//     showId: string,
//     seatIds: string[],
//     lockId: string,
//   ): Promise<LockSeatsResult> {
//     if (seatIds.length === 0) {
//       throw new BadRequestException('At least one seat is required');
//     }

//     const uniqueSeatIds = [...new Set(seatIds)];

//     if (uniqueSeatIds.length !== seatIds.length) {
//       throw new BadRequestException('Duplicate seat IDs are not allowed');
//     }

//     const show = await this.prisma.show.findUnique({
//       where: {
//         id: showId,
//       },
//     });

//     if (!show) {
//       throw new NotFoundException('Show not found');
//     }

//     const showSeats = await this.prisma.showSeat.findMany({
//       where: {
//         showId,
//         id: {
//           in: uniqueSeatIds,
//         },
//       },
//       select: {
//         id: true,
//         status: true,
//       },
//     });

//     if (showSeats.length !== uniqueSeatIds.length) {
//       throw new BadRequestException(
//         'One or more selected seats do not belong to this show',
//       );
//     }

//     const unavailableSeats = showSeats.filter(
//       (seat) => seat.status !== 'AVAILABLE',
//     );

//     if (unavailableSeats.length > 0) {
//       throw new BadRequestException(
//         `Seat(s) ${unavailableSeats
//           .map((seat) => seat.id)
//           .join(', ')} are not available`,
//       );
//     }

//     const keys = this.getSeatKeys(showId, uniqueSeatIds);

//     /**
//      * Redis executes Lua scripts atomically.
//      *
//      * We first check every seat.
//      * If even one seat is already locked, nothing is changed.
//      *
//      * This prevents:
//      *
//      * seat A -> locked
//      * seat B -> locked
//      * seat C -> fails
//      *
//      * Instead the whole operation fails.
//      */
//     const luaScript = `
//   for i = 1, #KEYS do
//     local existing = redis.call('GET', KEYS[i])

//     if existing ~= false and existing ~= ARGV[1] then
//       return 0
//     end
//   end

//   for i = 1, #KEYS do
//     redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
//   end

//   return 1
// `;

//     const result = await this.redisService
//       .getClient()
//       .eval(luaScript, keys.length, ...keys, lockId, this.LOCK_TTL_SECONDS);

//     if (result !== 1) {
//       const lockedSeats = await this.getLockedSeats(showId, uniqueSeatIds);

//       const unavailableSeatIds = lockedSeats
//         .filter((seat) => seat.locked && seat.lockId !== lockId)
//         .map((seat) => seat.seatId);

//       throw new BadRequestException({
//         message: 'One or more selected seats are currently locked',
//         seatIds: unavailableSeatIds,
//       });
//     }

//     return {
//       success: true,
//       showId,
//       seatIds: uniqueSeatIds,
//       lockId,
//       expiresIn: this.LOCK_TTL_SECONDS,
//     };
//   }

//   async getLockedSeatsForShow(showId: string): Promise<LockStatus[]> {
//     const pattern = `show:{${showId}}:seat:*`;

//     const keys = await this.redisService.getClient().keys(pattern);

//     if (keys.length === 0) {
//       return [];
//     }

//     const result: LockStatus[] = [];

//     for (const key of keys) {
//       const seatId = key.split(':').pop();

//       if (!seatId) {
//         continue;
//       }

//       const [lockId, ttl] = await Promise.all([
//         this.redisService.get(key),
//         this.redisService.ttl(key),
//       ]);

//       if (lockId !== null && ttl > 0) {
//         result.push({
//           seatId,
//           locked: true,
//           lockId,
//           ttl,
//         });
//       }
//     }

//     return result;
//   }

//   async unlockSeats(
//     showId: string,
//     seatIds: string[],
//     lockId: string,
//   ): Promise<string[]> {
//     const keys = this.getSeatKeys(showId, seatIds);

//     if (keys.length === 0) {
//       return [];
//     }

//     const luaScript = `
//     local released = {}

//     for i = 1, #KEYS do
//       if redis.call('GET', KEYS[i]) == ARGV[1] then
//         redis.call('DEL', KEYS[i])
//         table.insert(released, i)
//       end
//     end

//     return released
//   `;

//     const result = await this.redisService
//       .getClient()
//       .eval(luaScript, keys.length, ...keys, lockId);

//     if (!Array.isArray(result)) {
//       return [];
//     }

//     return result
//       .map(Number)
//       .filter((index) => index >= 1 && index <= seatIds.length)
//       .map((index) => seatIds[index - 1]);
//   }

//   async refreshLock(
//     showId: string,
//     seatIds: string[],
//     lockId: string,
//   ): Promise<string[]> {
//     const keys = this.getSeatKeys(showId, seatIds);

//     if (keys.length === 0) {
//       return [];
//     }

//     const luaScript = `
//     local refreshed = {}

//     for i = 1, #KEYS do
//       if redis.call('GET', KEYS[i]) == ARGV[1] then
//         redis.call('EXPIRE', KEYS[i], ARGV[2])
//         table.insert(refreshed, i)
//       end
//     end

//     return refreshed
//   `;

//     const result = await this.redisService
//       .getClient()
//       .eval(luaScript, keys.length, ...keys, lockId, this.LOCK_TTL_SECONDS);

//     if (!Array.isArray(result)) {
//       return [];
//     }

//     return result
//       .map(Number)
//       .filter((index) => index >= 1 && index <= seatIds.length)
//       .map((index) => seatIds[index - 1]);
//   }
//   /**
//    * Used by checkout/payment to verify ownership.
//    */
//   async verifyLock(
//     showId: string,
//     seatIds: string[],
//     lockId: string,
//   ): Promise<boolean> {
//     const keys = this.getSeatKeys(showId, seatIds);

//     if (keys.length === 0) {
//       return false;
//     }

//     const luaScript = `
//       for i = 1, #KEYS do
//         if redis.call('GET', KEYS[i]) ~= ARGV[1] then
//           return 0
//         end
//       end

//       return 1
//     `;

//     const result = await this.redisService
//       .getClient()
//       .eval(luaScript, keys.length, ...keys, lockId);

//     return result === 1;
//   }

//   async getLockedSeats(
//     showId: string,
//     seatIds: string[],
//   ): Promise<LockStatus[]> {
//     const result: LockStatus[] = [];

//     for (const seatId of seatIds) {
//       const key = this.getSeatKey(showId, seatId);

//       const [lockId, ttl] = await Promise.all([
//         this.redisService.get(key),
//         this.redisService.ttl(key),
//       ]);

//       result.push({
//         seatId,
//         locked: lockId !== null,
//         lockId,
//         ttl,
//       });
//     }

//     return result;
//   }

//   async getLockStatus(
//     showId: string,
//     seatIds: string[],
//   ): Promise<LockStatus[]> {
//     return this.getLockedSeats(showId, seatIds);
//   }
// }

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type LockSeatsResult = {
  success: boolean;
  showId: string;
  seatIds: string[];
  lockId: string;
  expiresIn: number;
};

type LockStatus = {
  seatId: string;
  locked: boolean;
  lockId: string | null;
  ttl: number;
};

@Injectable()
export class SeatLockService {
  /**
   * Maximum time a user can hold seats.
   *
   * This is a HARD 5-minute booking window.
   *
   * Selecting additional seats does NOT create another 5 minutes.
   */
  private readonly LOCK_TTL_SECONDS = Number(
    process.env.SEAT_LOCK_TTL_SECONDS ?? 5 * 60,
  );

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Redis key for an individual show seat.
   *
   * Example:
   *
   * show:{showId}:seat:{seatId}
   */
  private getSeatKey(showId: string, seatId: string): string {
    return `show:{${showId}}:seat:${seatId}`;
  }

  private getSeatKeys(showId: string, seatIds: string[]): string[] {
    return seatIds.map((seatId) => this.getSeatKey(showId, seatId));
  }

  /**
   * Redis key representing the user's entire seat-lock session.
   *
   * Example:
   *
   * show:{showId}:lock:{lockId}
   *
   * This key is the source of truth for the original 5-minute deadline.
   */
  private getLockSessionKey(showId: string, lockId: string): string {
    return `show:{${showId}}:lock:${lockId}`;
  }

  async getLockTtl(showId: string, lockId: string): Promise<number> {
    const lockKey = this.getLockSessionKey(showId, lockId);

    const ttl = await this.redisService.ttl(lockKey);

    console.log('[SeatLock] getLockTtl:', {
      showId,
      lockId,
      lockKey,
      ttl,
    });

    if (ttl <= 0) {
      return 0;
    }

    return ttl;
  }
  /**
   * Atomically locks all requested seats.
   *
   * Important behavior:
   *
   * 1. First seat starts the 5-minute timer.
   * 2. Additional seats use the SAME expiry deadline.
   * 3. Existing seats owned by the same lockId are NOT refreshed.
   * 4. If another user owns any requested seat, the whole operation fails.
   *
   * Returns:
   * 1 -> all seats successfully locked
   * 0 -> at least one seat is already locked by another user
   */
  async lockSeats(
    showId: string,
    seatIds: string[],
    lockId: string,
  ): Promise<LockSeatsResult> {
    if (seatIds.length === 0) {
      throw new BadRequestException('At least one seat is required');
    }

    const uniqueSeatIds = [...new Set(seatIds)];

    if (uniqueSeatIds.length !== seatIds.length) {
      throw new BadRequestException('Duplicate seat IDs are not allowed');
    }

    const show = await this.prisma.show.findUnique({
      where: {
        id: showId,
      },
    });

    if (!show) {
      throw new NotFoundException('Show not found');
    }

    /**
     * Validate that all requested seats belong to this show.
     */
    const showSeats = await this.prisma.showSeat.findMany({
      where: {
        showId,
        id: {
          in: uniqueSeatIds,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (showSeats.length !== uniqueSeatIds.length) {
      throw new BadRequestException(
        'One or more selected seats do not belong to this show',
      );
    }

    /**
     * Check database-level seat availability.
     */
    const unavailableSeats = showSeats.filter(
      (seat) => seat.status !== 'AVAILABLE',
    );

    if (unavailableSeats.length > 0) {
      throw new BadRequestException(
        `Seat(s) ${unavailableSeats
          .map((seat) => seat.id)
          .join(', ')} are not available`,
      );
    }

    const seatKeys = this.getSeatKeys(showId, uniqueSeatIds);
    const lockSessionKey = this.getLockSessionKey(showId, lockId);

    /**
     * Redis executes Lua scripts atomically.
     *
     * ARGV[1] = lockId
     * ARGV[2] = initial TTL in seconds
     *
     * KEYS:
     *   KEYS[1..n] = seat keys
     *   KEYS[n + 1] = lock session key
     *
     * Flow:
     *
     * 1. Check every seat.
     *    - available -> okay
     *    - owned by us -> okay
     *    - owned by another user -> fail
     *
     * 2. Get the lock-session TTL.
     *
     * 3. If this is the first seat:
     *    create the session with 300 seconds.
     *
     * 4. If this is an existing session:
     *    use the remaining session TTL.
     *
     * 5. Existing seats owned by us are NOT overwritten.
     *
     * 6. New seats receive the remaining session TTL.
     *
     * This means:
     *
     * 12:00:00 -> Seat A selected
     * 12:00:00 -> 300 seconds
     *
     * 12:02:00 -> Seat B selected
     * 12:02:00 -> Seat B gets ~180 seconds
     *
     * Both expire around:
     * 12:05:00
     */
    const luaScript = `
      local lockId = ARGV[1]
      local initialTtl = tonumber(ARGV[2])

      local sessionKey = KEYS[#KEYS]
      local seatKeyCount = #KEYS - 1

      -- ---------------------------------------------------------
      -- 1. Verify that none of the requested seats is owned
      --    by another lock.
      -- ---------------------------------------------------------

      for i = 1, seatKeyCount do
        local existing = redis.call('GET', KEYS[i])

        if existing ~= false and existing ~= lockId then
          return 0
        end
      end

      -- ---------------------------------------------------------
      -- 2. Get the current booking-session TTL.
      -- ---------------------------------------------------------

      local sessionTtl = redis.call('TTL', sessionKey)

      -- ---------------------------------------------------------
      -- 3. First seat:
      --    create the booking session.
      -- ---------------------------------------------------------

      if sessionTtl <= 0 then
        sessionTtl = initialTtl

        redis.call(
          'SET',
          sessionKey,
          lockId,
          'EX',
          sessionTtl
        )
      end

      -- ---------------------------------------------------------
      -- 4. Lock only seats that are not already owned by us.
      --
      --    IMPORTANT:
      --    We intentionally DO NOT SET existing seats again.
      --
      --    This prevents their TTL from being reset.
      -- ---------------------------------------------------------

      for i = 1, seatKeyCount do
        local existing = redis.call('GET', KEYS[i])

        if existing == false then
          redis.call(
            'SET',
            KEYS[i],
            lockId,
            'EX',
            sessionTtl
          )
        end
      end

      return sessionTtl
    `;

    const result = await this.redisService
      .getClient()
      .eval(
        luaScript,
        seatKeys.length + 1,
        ...seatKeys,
        lockSessionKey,
        lockId,
        this.LOCK_TTL_SECONDS,
      );

    /**
     * 0 means another user owns at least one requested seat.
     */
    if (result === 0) {
      const lockedSeats = await this.getLockedSeats(showId, uniqueSeatIds);

      const unavailableSeatIds = lockedSeats
        .filter((seat) => seat.locked && seat.lockId !== lockId)
        .map((seat) => seat.seatId);

      throw new BadRequestException({
        message: 'One or more selected seats are currently locked',
        seatIds: unavailableSeatIds,
      });
    }

    const expiresIn = Number(result);

    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new BadRequestException(
        'Seat lock has expired. Please select the seats again.',
      );
    }

    return {
      success: true,
      showId,
      seatIds: uniqueSeatIds,
      lockId,
      expiresIn,
    };
  }

  /**
   * Get all currently locked seats for a show.
   *
   * Used when a new user joins the show room.
   */
  async getLockedSeatsForShow(showId: string): Promise<LockStatus[]> {
    const pattern = `show:{${showId}}:seat:*`;

    const keys = await this.redisService.getClient().keys(pattern);

    if (keys.length === 0) {
      return [];
    }

    const result: LockStatus[] = [];

    for (const key of keys) {
      const seatId = key.split(':').pop();

      if (!seatId) {
        continue;
      }

      const [lockId, ttl] = await Promise.all([
        this.redisService.get(key),
        this.redisService.ttl(key),
      ]);

      if (lockId !== null && ttl > 0) {
        result.push({
          seatId,
          locked: true,
          lockId,
          ttl,
        });
      }
    }

    return result;
  }

  /**
   * Unlock seats owned by this lockId.
   *
   * A user cannot unlock another user's seats.
   */
  async unlockSeats(
    showId: string,
    seatIds: string[],
    lockId: string,
  ): Promise<string[]> {
    const keys = this.getSeatKeys(showId, seatIds);

    if (keys.length === 0) {
      return [];
    }

    const luaScript = `
      local released = {}

      for i = 1, #KEYS do
        if redis.call('GET', KEYS[i]) == ARGV[1] then
          redis.call('DEL', KEYS[i])
          table.insert(released, i)
        end
      end

      return released
    `;

    const result = await this.redisService
      .getClient()
      .eval(luaScript, keys.length, ...keys, lockId);

    if (!Array.isArray(result)) {
      return [];
    }

    const releasedSeatIds = result
      .map(Number)
      .filter((index) => index >= 1 && index <= seatIds.length)
      .map((index) => seatIds[index - 1]);

    /**
     * If no seats remain locked by this booking session,
     * remove the session key as well.
     *
     * This allows a new seat selection to start a fresh
     * 5-minute booking window.
     */
    if (releasedSeatIds.length > 0) {
      const remainingSeats = await this.getLockedSeats(showId, seatIds);

      const hasOwnLocks = remainingSeats.some(
        (seat) => seat.locked && seat.lockId === lockId,
      );

      if (!hasOwnLocks) {
        await this.redisService
          .getClient()
          .del(this.getLockSessionKey(showId, lockId));
      }
    }

    console.log('@@@releasedSeats->', releasedSeatIds);
    return releasedSeatIds;
  }

  /**
   * Refresh the current seat locks.
   *
   * IMPORTANT:
   *
   * This does NOT extend the original 5-minute booking window.
   *
   * It only synchronizes individual seat TTLs with the
   * remaining booking-session TTL.
   *
   * This method can therefore safely be called by the frontend
   * every 60 seconds if you want to keep the Redis seat TTLs
   * synchronized.
   */
  async refreshLock(
    showId: string,
    seatIds: string[],
    lockId: string,
  ): Promise<string[]> {
    const keys = this.getSeatKeys(showId, seatIds);

    if (keys.length === 0) {
      return [];
    }

    const sessionKey = this.getLockSessionKey(showId, lockId);

    /**
     * The session TTL is the authoritative deadline.
     */
    const sessionTtl = await this.redisService.getClient().ttl(sessionKey);

    /**
     * Session does not exist anymore.
     *
     * The booking window has expired.
     */
    if (sessionTtl <= 0) {
      return [];
    }

    const luaScript = `
      local refreshed = {}
      local sessionTtl = tonumber(ARGV[2])

      for i = 1, #KEYS do
        if redis.call('GET', KEYS[i]) == ARGV[1] then

          -- Never extend beyond the original session deadline.
          redis.call(
            'EXPIRE',
            KEYS[i],
            sessionTtl
          )

          table.insert(refreshed, i)
        end
      end

      return refreshed
    `;

    const result = await this.redisService
      .getClient()
      .eval(luaScript, keys.length, ...keys, lockId, sessionTtl);

    if (!Array.isArray(result)) {
      return [];
    }

    return result
      .map(Number)
      .filter((index) => index >= 1 && index <= seatIds.length)
      .map((index) => seatIds[index - 1]);
  }

  /**
   * Used by checkout/payment to verify ownership.
   *
   * Both conditions must be true:
   *
   * 1. Lock session still exists.
   * 2. Every requested seat belongs to this lockId.
   */

  // async verifyLock(
  //   showId: string,
  //   seatIds: string[],
  //   lockId: string,
  // ): Promise<boolean> {
  //   const keys = this.getSeatKeys(showId, seatIds);

  //   if (keys.length === 0) {
  //     return false;
  //   }

  //   const sessionKey = this.getLockSessionKey(showId, lockId);

  //   const luaScript = `
  //     -- Booking session must still exist.
  //     if redis.call('EXISTS', KEYS[#KEYS]) == 0 then
  //       return 0
  //     end

  //     -- Every requested seat must belong to this lock.
  //     for i = 1, #KEYS - 1 do
  //       if redis.call('GET', KEYS[i]) ~= ARGV[1] then
  //         return 0
  //       end
  //     end

  //     return 1
  //   `;

  //   const result = await this.redisService
  //     .getClient()
  //     .eval(luaScript, keys.length + 1, ...keys, sessionKey, lockId);

  //   const failedIndex = Math.abs(Number(result)) - 1;

  //   if (result === 0) {
  //     console.error('[SeatLock] Session expired/missing', {
  //       showId,
  //       lockId,
  //       sessionKey,
  //       seatIds,
  //     });

  //     return false;
  //   }
  //   console.error('[SeatLock] Seat lock mismatch', {
  //     showId,
  //     lockId,
  //     seatId: seatIds[failedIndex],
  //     seatKey: keys[failedIndex],
  //     failedIndex,
  //   });

  //   return result === 1;
  // }

  async verifyLock(
    showId: string,
    seatIds: string[],
    lockId: string,
  ): Promise<boolean> {
    const keys = this.getSeatKeys(showId, seatIds);

    if (keys.length === 0) {
      return false;
    }

    const sessionKey = this.getLockSessionKey(showId, lockId);
    const client = this.redisService.getClient();

    // ---------------------------------------------------------
    // DEBUG REDIS STATE
    // ---------------------------------------------------------

    const sessionValue = await client.get(sessionKey);
    const sessionTtl = await client.ttl(sessionKey);

    const seats = await Promise.all(
      keys.map(async (key, index) => {
        const value = await client.get(key);
        const ttl = await client.ttl(key);

        return {
          index,
          seatId: seatIds[index],
          key,
          value,
          ttl,
          expectedLockId: lockId,
          matches: value === lockId,
        };
      }),
    );

    console.error('[SeatLock] VERIFY DEBUG', {
      showId,
      lockId,

      session: {
        key: sessionKey,
        value: sessionValue,
        ttl: sessionTtl,
      },

      seats,
    });

    // ---------------------------------------------------------
    // ATOMIC VERIFICATION
    // ---------------------------------------------------------

    const luaScript = `
    if redis.call('EXISTS', KEYS[#KEYS]) == 0 then
      return 0
    end

    for i = 1, #KEYS - 1 do
      if redis.call('GET', KEYS[i]) ~= ARGV[1] then
        return -(i)
      end
    end

    return 1
  `;

    const result = await client.eval(
      luaScript,
      keys.length + 1,
      ...keys,
      sessionKey,
      lockId,
    );

    if (result === 1) {
      return true;
    }

    if (result === 0) {
      console.error('[SeatLock] Session expired/missing', {
        showId,
        lockId,
        sessionKey,
        seatIds,
      });

      return false;
    }

    const failedIndex = Math.abs(Number(result)) - 1;

    console.error('[SeatLock] Seat lock mismatch', {
      showId,
      lockId,
      seatId: seatIds[failedIndex],
      seatKey: keys[failedIndex],
      failedIndex,
    });

    return false;
  }
  /**
   * Get lock information for specific seats.
   */
  async getLockedSeats(
    showId: string,
    seatIds: string[],
  ): Promise<LockStatus[]> {
    const result: LockStatus[] = [];

    for (const seatId of seatIds) {
      const key = this.getSeatKey(showId, seatId);

      const [lockId, ttl] = await Promise.all([
        this.redisService.get(key),
        this.redisService.getClient().ttl(key),
      ]);

      result.push({
        seatId,
        locked: lockId !== null && ttl > 0,
        lockId,
        ttl,
      });
    }

    return result;
  }

  async getLockStatus(
    showId: string,
    seatIds: string[],
  ): Promise<LockStatus[]> {
    return this.getLockedSeats(showId, seatIds);
  }
}
