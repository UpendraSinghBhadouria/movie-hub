import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RequestLoggerMiddleware } from './common/middlewares/logger.middleware.js';
import { MoviesModule } from './movies/movies.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import { TheatresModule } from './theatres/theatres.module.js';
import { ShowsModule } from './shows/shows.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './redis/redis.module.js';
import { SeatLockModule } from './seat-lock/seat-lock.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { BookingModule } from './booking/booking.module.js';

@Module({
  imports: [
    PrismaModule,
    MoviesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TheatresModule,
    ShowsModule,
    AuthModule,
    RedisModule,
    SeatLockModule,
    PaymentModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
