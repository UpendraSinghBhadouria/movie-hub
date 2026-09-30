import { Module } from '@nestjs/common';
import { SeatLockGateway } from './seat-lock.gateway.js';
import { SeatLockService } from './seat-lock.service.js';
import { SeatLockExpiryService } from './seat-lock.expiry.service.js';

@Module({
  providers: [SeatLockService, SeatLockGateway, SeatLockExpiryService],
  exports: [SeatLockService],
})
export class SeatLockModule {}
