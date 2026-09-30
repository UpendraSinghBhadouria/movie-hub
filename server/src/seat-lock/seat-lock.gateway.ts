// import {
//   ConnectedSocket,
//   MessageBody,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { SeatLockService } from './seat-lock.service.js';

// type JoinShowPayload = {
//   showId: string;
// };

// type LockSeatsPayload = {
//   showId: string;
//   seatIds: string[];
//   lockId: string;
// };

// type UnlockSeatsPayload = {
//   showId: string;
//   seatIds: string[];
//   lockId: string;
// };

// type RefreshLockPayload = {
//   showId: string;
//   seatIds: string[];
//   lockId: string;
// };

// @WebSocketGateway({
//   namespace: '/seat-lock',
//   cors: {
//     origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
//     credentials: true,
//   },
// })
// export class SeatLockGateway {
//   @WebSocketServer()
//   server: Server;

//   constructor(private readonly seatLockService: SeatLockService) {}

//   private getShowRoom(showId: string): string {
//     return `show:${showId}`;
//   }

//   // @SubscribeMessage('join-show')
//   // async joinShow(
//   //   @ConnectedSocket() client: Socket,
//   //   @MessageBody() payload: JoinShowPayload,
//   // ) {
//   //   const room = this.getShowRoom(payload.showId);

//   //   await client.join(room);

//   //   return {
//   //     success: true,
//   //     showId: payload.showId,
//   //   };
//   // }

//   @SubscribeMessage('join-show')
//   async joinShow(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: JoinShowPayload,
//   ) {
//     const room = this.getShowRoom(payload.showId);

//     await client.join(room);

//     const lockedSeats = await this.seatLockService.getLockedSeatsForShow(
//       payload.showId,
//     );

//     client.emit('current-seat-locks', {
//       showId: payload.showId,
//       seats: lockedSeats,
//     });

//     return {
//       success: true,
//       showId: payload.showId,
//     };
//   }

//   @SubscribeMessage('leave-show')
//   async leaveShow(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: JoinShowPayload,
//   ) {
//     const room = this.getShowRoom(payload.showId);

//     await client.leave(room);

//     return {
//       success: true,
//       showId: payload.showId,
//     };
//   }

//   @SubscribeMessage('lock-seats')
//   async lockSeats(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: LockSeatsPayload,
//   ) {
//     try {
//       const result = await this.seatLockService.lockSeats(
//         payload.showId,
//         payload.seatIds,
//         payload.lockId,
//       );

//       const room = this.getShowRoom(payload.showId);

//       client.to(room).emit('seat-locked', {
//         showId: payload.showId,
//         seatIds: result.seatIds,
//         lockId: payload.lockId,
//         expiresIn: result.expiresIn,
//       });

//       return {
//         success: true,
//         data: result,
//       };
//     } catch (error) {
//       const errorResponse =
//         error && typeof error === 'object' && 'response' in error
//           ? (error.response as {
//               message?: string;
//               seatIds?: string[];
//             })
//           : undefined;

//       client.emit('seat-lock-failed', {
//         showId: payload.showId,
//         seatIds: errorResponse?.seatIds ?? payload.seatIds,
//         lockId: payload.lockId,
//         message:
//           typeof errorResponse?.message === 'string'
//             ? errorResponse.message
//             : 'Unable to lock selected seats',
//       });

//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Unable to lock selected seats',
//       };
//     }
//   }

//   @SubscribeMessage('unlock-seats')
//   async unlockSeats(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: UnlockSeatsPayload,
//   ) {
//     const releasedSeats = await this.seatLockService.unlockSeats(
//       payload.showId,
//       payload.seatIds,
//       payload.lockId,
//     );

//     if (releasedSeats.length > 0) {
//       const room = this.getShowRoom(payload.showId);

//       client.to(room).emit('seat-unlocked', {
//         showId: payload.showId,
//         seatIds: releasedSeats,
//       });
//     }

//     return {
//       success: true,
//       seatIds: releasedSeats,
//     };
//   }

//   @SubscribeMessage('refresh-lock')
//   async refreshLock(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: RefreshLockPayload,
//   ) {
//     const refreshedSeats = await this.seatLockService.refreshLock(
//       payload.showId,
//       payload.seatIds,
//       payload.lockId,
//     );

//     return {
//       success: refreshedSeats.length === payload.seatIds.length,
//       seatIds: refreshedSeats,
//       expiresIn: 5 * 60,
//     };
//   }
// }

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SeatLockService } from './seat-lock.service.js';

type JoinShowPayload = {
  showId: string;
};

type LockSeatsPayload = {
  showId: string;
  seatIds: string[];
  lockId: string;
};

type UnlockSeatsPayload = {
  showId: string;
  seatIds: string[];
  lockId: string;
};

type RefreshLockPayload = {
  showId: string;
  seatIds: string[];
  lockId: string;
};

@WebSocketGateway({
  namespace: '/seat-lock',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class SeatLockGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly seatLockService: SeatLockService) {}

  private getShowRoom(showId: string): string {
    return `show:${showId}`;
  }

  emitSeatsUnlocked(showId: string, seatIds: string[]): void {
    const room = this.getShowRoom(showId);

    this.server.to(room).emit('seat-unlocked', {
      showId,
      seatIds,
    });
  }
  /**
   * Join a show room.
   *
   * When a user joins, immediately send the current Redis
   * seat-lock state to that client.
   *
   * The frontend must register the `current-seat-locks`
   * listener BEFORE emitting `join-show`.
   */
  @SubscribeMessage('join-show')
  async joinShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinShowPayload,
  ) {
    const room = this.getShowRoom(payload.showId);

    await client.join(room);

    const lockedSeats = await this.seatLockService.getLockedSeatsForShow(
      payload.showId,
    );

    client.emit('current-seat-locks', {
      showId: payload.showId,
      seats: lockedSeats,
    });

    return {
      success: true,
      showId: payload.showId,
    };
  }

  /**
   * Leave the show room.
   */
  @SubscribeMessage('leave-show')
  async leaveShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinShowPayload,
  ) {
    const room = this.getShowRoom(payload.showId);

    await client.leave(room);

    return {
      success: true,
      showId: payload.showId,
    };
  }

  /**
   * Lock seats.
   *
   * The SeatLockService is responsible for the atomic Redis
   * operation and the fixed 5-minute deadline.
   */
  @SubscribeMessage('lock-seats')
  async lockSeats(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LockSeatsPayload,
  ) {
    try {
      const result = await this.seatLockService.lockSeats(
        payload.showId,
        payload.seatIds,
        payload.lockId,
      );

      const room = this.getShowRoom(payload.showId);

      /**
       * Notify every OTHER user in the show room.
       *
       * The current client receives the acknowledgement
       * through the Socket.IO callback.
       */
      client.to(room).emit('seat-locked', {
        showId: payload.showId,
        seatIds: result.seatIds,
        lockId: payload.lockId,
        expiresIn: result.expiresIn,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorResponse =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as {
              message?: string;
              seatIds?: string[];
            })
          : undefined;

      /**
       * Notify the current client that the lock failed.
       */
      client.emit('seat-lock-failed', {
        showId: payload.showId,
        seatIds: errorResponse?.seatIds ?? payload.seatIds,
        lockId: payload.lockId,
        message:
          typeof errorResponse?.message === 'string'
            ? errorResponse.message
            : 'Unable to lock selected seats',
      });

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to lock selected seats',
      };
    }
  }

  /**
   * Unlock seats.
   *
   * The SeatLockService only releases seats owned by
   * the supplied lockId.
   */
  @SubscribeMessage('unlock-seats')
  async unlockSeats(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UnlockSeatsPayload,
  ) {
    const releasedSeats = await this.seatLockService.unlockSeats(
      payload.showId,
      payload.seatIds,
      payload.lockId,
    );

    /**
     * Notify other users only when seats were actually
     * released.
     */
    if (releasedSeats.length > 0) {
      //   const room = this.getShowRoom(payload.showId);

      //   client.to(room).emit('seat-unlocked', {
      //     showId: payload.showId,
      //     seatIds: releasedSeats,
      //   });
      // }

      this.emitSeatsUnlocked(payload.showId, releasedSeats);
      return {
        success: true,
        seatIds: releasedSeats,
      };
    }
  }

  /**
   * Synchronize seat TTLs with the original booking
   * session deadline.
   *
   * IMPORTANT:
   *
   * This does NOT create another 5-minute window.
   *
   * Example:
   *
   * Original lock:
   *   300 seconds
   *
   * After 2 minutes:
   *   refresh -> 180 seconds
   *
   * After 4 minutes:
   *   refresh -> 60 seconds
   *
   * It can never become 300 seconds again.
   */
  @SubscribeMessage('refresh-lock')
  async refreshLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RefreshLockPayload,
  ) {
    const refreshedSeats = await this.seatLockService.refreshLock(
      payload.showId,
      payload.seatIds,
      payload.lockId,
    );

    /**
     * Get the actual remaining session TTL.
     *
     * This is important because the previous implementation
     * always returned 300 seconds.
     */
    const lockStatus = await this.seatLockService.getLockedSeats(
      payload.showId,
      payload.seatIds,
    );

    const ownedSeats = lockStatus.filter(
      (seat) => seat.locked && seat.lockId === payload.lockId,
    );

    const expiresIn =
      ownedSeats.length > 0
        ? Math.max(...ownedSeats.map((seat) => seat.ttl))
        : 0;

    const success =
      refreshedSeats.length === payload.seatIds.length && expiresIn > 0;

    /**
     * If the refresh failed because the lock expired,
     * notify the client.
     */
    if (!success) {
      client.emit('seat-lock-failed', {
        showId: payload.showId,
        seatIds: payload.seatIds,
        lockId: payload.lockId,
        message: 'Your seat selection has expired.',
      });
    }

    return {
      success,
      seatIds: refreshedSeats,
      expiresIn,
      message: success ? undefined : 'Your seat selection has expired.',
    };
  }
}
