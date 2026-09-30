import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.redis.ping();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  getClient(): Redis {
    return this.redis;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<'OK' | null> {
    return this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    return this.redis.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }
}
