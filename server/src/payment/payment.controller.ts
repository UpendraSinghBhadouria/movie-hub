import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { PaymentService } from './payment.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { AccessTokenGuard } from '../common/guards/access-token.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
}

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create internal booking + Stripe PaymentIntent
   *
   * POST /api/payment/create-order
   *
   * Requires authentication.
   */
  @UseGuards(AccessTokenGuard)
  @Post('create-order')
  async createOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentService.createPaymentIntent(req.user.id, dto);
  }

  /**
   * Verify Stripe PaymentIntent
   *
   * POST /api/payment/verify
   *
   * This is useful after Stripe.confirmPayment() completes.
   * The backend retrieves the PaymentIntent directly from Stripe
   * instead of trusting the frontend payment status.
   */
  @UseGuards(AccessTokenGuard)
  @Post('verify')
  async verifyPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyPayment(req.user.id, dto.paymentIntentId);
  }

  /**
   * Stripe Webhook
   *
   * POST /api/payment/webhook
   *
   * IMPORTANT:
   * This endpoint must NOT use JwtAuthGuard.
   *
   * Stripe signs the raw request body using the
   * Stripe-Signature header.
   */
  @Post('webhook')
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error(
        'Raw request body is required for Stripe webhook verification',
      );
    }

    return this.paymentService.handleWebhook(req.rawBody, signature);
  }

  /**
   * Get booking/payment status
   *
   * GET /api/payment/:bookingId/status
   *
   * Requires authentication.
   */
  @UseGuards(AccessTokenGuard)
  @Get(':bookingId/status')
  async getBookingPaymentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentService.getBookingPaymentStatus(req.user.id, bookingId);
  }
}
