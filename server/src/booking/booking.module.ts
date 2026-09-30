import { Module } from '@nestjs/common';

import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { SeatLockModule } from '../seat-lock/seat-lock.module.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule, SeatLockModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
