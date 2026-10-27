// import { Global, Module } from '@nestjs/common';
// import { Redis } from 'ioredis';
// import { RedisService } from './redis.service.js';

// @Global()
// @Module({
//   providers: [
//     RedisService,
//     {
//       provide: 'REDIS_CLIENT',
//       useFactory: () => {
//         return new Redis({
//           host: process.env.REDIS_HOST ?? 'localhost',
//           port: Number(process.env.REDIS_PORT ?? 6379),
//           maxRetriesPerRequest: null,
//         });
//       },
//     },
//   ],
//   exports: [RedisService],
// })
// export class RedisModule {}

import { Global, Logger, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service.js';

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (): Redis => {
        const url = process.env.REDIS_URL;

        if (!url) {
          throw new Error('REDIS_URL is not configured');
        }

        const redis = new Redis(url, {
          maxRetriesPerRequest: null,
          connectTimeout: 10000,
          retryStrategy(times) {
            return Math.min(times * 500, 5000);
          },
        });

        redis.on('ready', () => logger.log('Redis ready'));
        redis.on('close', () => logger.warn('Redis connection closed'));
        redis.on('error', (err) => logger.error(`Redis error: ${err.message}`));

        return redis;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
