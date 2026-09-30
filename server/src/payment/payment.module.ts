import { Module } from '@nestjs/common';

import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { StripeService } from './stripe.service.js';
import { SeatLockModule } from '../seat-lock/seat-lock.module.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule, SeatLockModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService],
  exports: [PaymentService],
})
export class PaymentModule {}
