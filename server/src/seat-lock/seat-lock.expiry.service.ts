import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { SeatLockGateway } from './seat-lock.gateway.js';

@Injectable()
export class SeatLockExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SeatLockExpiryService.name);

  private subscriber: Redis | null = null;

  constructor(private readonly seatLockGateway: SeatLockGateway) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL is not configured');
    }

    this.subscriber = new Redis(redisUrl);

    this.subscriber.on('error', (error) => {
      this.logger.error('Redis expiry subscriber error', error);
    });

    this.subscriber.on('connect', () => {
      this.logger.log('Redis expiry subscriber connected');
    });

    /*
     * Redis sends expired key names through:
     *
     * __keyevent@<db>__:expired
     *
     * Example:
     *
     * __keyevent@0__:expired
     *   ↓
     * show:{showId}:seat:{seatId}
     */
    await this.subscriber.config('SET', 'notify-keyspace-events', 'Ex');

    const database = this.getRedisDatabase();

    await this.subscriber.subscribe(`__keyevent@${database}__:expired`);

    this.subscriber.on('message', (channel, key) => {
      this.handleExpiredKey(channel, key);
    });

    this.logger.log(
      `Listening for Redis key expirations on database ${database}`,
    );
  }

  private handleExpiredKey(channel: string, key: string): void {
    if (!channel.includes(':expired')) {
      return;
    }

    const match = key.match(/^show:\{([^}]+)\}:seat:([^:]+)$/);

    if (!match) {
      return;
    }

    const [, showId, seatId] = match;

    if (!showId || !seatId) {
      return;
    }

    this.logger.debug(`Seat lock expired: showId=${showId}, seatId=${seatId}`);

    this.seatLockGateway.emitSeatsUnlocked(showId, [seatId]);
  }

  private getRedisDatabase(): number {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      return 0;
    }

    try {
      const url = new URL(redisUrl);
      const database = Number(url.pathname.replace('/', ''));

      return Number.isInteger(database) && database >= 0 ? database : 0;
    } catch {
      return 0;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.subscriber) {
      return;
    }

    try {
      await this.subscriber.unsubscribe();
      await this.subscriber.quit();
    } catch (error) {
      this.logger.error('Failed to close Redis expiry subscriber', error);
    } finally {
      this.subscriber = null;
    }
  }
}
