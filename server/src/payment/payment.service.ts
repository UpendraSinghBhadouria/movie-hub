import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import Stripe from 'stripe';
import crypto from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { SeatLockService } from '../seat-lock/seat-lock.service.js';
import { StripeService } from './stripe.service.js';

import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  private readonly stripeCurrency: string;
  private readonly stripeWebhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly seatLockService: SeatLockService,
    private readonly stripeService: StripeService,
  ) {
    this.stripeCurrency = process.env.STRIPE_CURRENCY ?? 'inr';

    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    if (!this.stripeWebhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET is not configured');
    }
  }

  // ============================================================
  // CREATE STRIPE PAYMENT INTENT
  // ============================================================

  async createPaymentIntent(userId: string, dto: CreateOrderDto) {
    const { showId, seatIds, lockId, offerCode } = dto;

    const uniqueSeatIds = [...new Set(seatIds)];

    if (uniqueSeatIds.length === 0) {
      throw new BadRequestException({
        message: 'At least one seat is required',
        err_code: 'VALIDATION_ERROR',
      });
    }

    // ----------------------------------------------------------
    // 1. Verify Redis seat lock
    // ----------------------------------------------------------

    const lockVerification = await this.seatLockService.verifyLock(
      showId,
      uniqueSeatIds,
      lockId,
    );

    if (!lockVerification) {
      throw new BadRequestException({
        message:
          'Your seat lock has expired or the selected seats are no longer locked by you',
        err_code: 'BOOKING_EXPIRED',
      });
    }

    // ----------------------------------------------------------
    // 2. Get show + movie + theatre + screen
    // ----------------------------------------------------------

    const show = await this.prisma.show.findUnique({
      where: {
        id: showId,
      },

      include: {
        movie: true,

        screen: {
          include: {
            theatre: true,
          },
        },
      },
    });

    if (!show) {
      throw new NotFoundException({
        message: 'Show not found',
        err_code: 'SHOW_NOT_FOUND',
      });
    }

    // ----------------------------------------------------------
    // 3. Get ShowSeat records
    // ----------------------------------------------------------

    const showSeats = await this.prisma.showSeat.findMany({
      where: {
        id: {
          in: uniqueSeatIds,
        },

        showId,
      },
    });

    if (showSeats.length !== uniqueSeatIds.length) {
      throw new BadRequestException({
        message: 'One or more selected seats do not belong to this show',
        err_code: 'SEAT_NOT_AVAILABLE',
      });
    }

    // ----------------------------------------------------------
    // 4. Check existing bookings
    // ----------------------------------------------------------

    const existingBookingSeats = await this.prisma.bookingSeat.findMany({
      where: {
        showId,

        seatId: {
          in: showSeats.map((seat) => seat.seatId),
        },

        status: {
          in: ['RESERVED', 'CONFIRMED'],
        },

        booking: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },

      select: {
        seatId: true,
      },
    });

    if (existingBookingSeats.length > 0) {
      throw new BadRequestException({
        message: 'One or more selected seats are already booked',

        err_code: 'SEAT_ALREADY_BOOKED',

        errors: existingBookingSeats.map((seat) => ({
          field: 'seatIds',

          message: `Seat ${seat.seatId} is already booked`,
        })),
      });
    }

    // ----------------------------------------------------------
    // 5. Calculate ticket amount
    // ----------------------------------------------------------

    const ticketsAmount = showSeats.reduce(
      (total, seat) => total + Number(seat.price),

      0,
    );

    // ----------------------------------------------------------
    // 6. Convenience fee
    // ----------------------------------------------------------

    const convenienceFee = this.calculateConvenienceFee(ticketsAmount);

    // ----------------------------------------------------------
    // 7. Taxes
    // ----------------------------------------------------------

    const taxes = this.calculateTaxes(ticketsAmount, convenienceFee);

    // ----------------------------------------------------------
    // 8. Offer
    // ----------------------------------------------------------

    const offerResult = await this.calculateOfferDiscount(
      offerCode,
      ticketsAmount,
    );

    const discount = offerResult.discount;

    const offerId = offerResult.offerId;

    // ----------------------------------------------------------
    // 9. Final amount
    // ----------------------------------------------------------

    const totalAmount = Math.max(
      0,
      ticketsAmount + convenienceFee + taxes - discount,
    );

    if (totalAmount <= 0) {
      throw new BadRequestException({
        message: 'Invalid booking amount',

        err_code: 'PAYMENT_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 10. Lock TTL
    // ----------------------------------------------------------

    const lockTtl = await this.seatLockService.getLockTtl(showId, lockId);

    if (lockTtl <= 0) {
      throw new BadRequestException({
        message: 'Your seat lock has expired',

        err_code: 'BOOKING_EXPIRED',
      });
    }

    const expiresAt = new Date(Date.now() + lockTtl * 1000);

    // ----------------------------------------------------------
    // 11. Booking number
    // ----------------------------------------------------------

    const bookingNumber = this.generateBookingNumber();

    // ----------------------------------------------------------
    // 12. Create internal booking
    // ----------------------------------------------------------

    const booking = await this.prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data: {
          bookingNumber,

          userId,

          showId,

          status: 'PENDING',

          lockId,

          ticketsAmount,

          convenienceFee,

          taxes,

          discount,

          totalAmount,

          offerId,

          expiresAt,

          bookingSeats: {
            create: showSeats.map((seat) => ({
              showId,

              seatId: seat.seatId,

              status: 'RESERVED',

              price: seat.price,
            })),
          },
        },

        include: {
          bookingSeats: true,
        },
      });
    });

    // ----------------------------------------------------------
    // 13. Create Stripe PaymentIntent
    // ----------------------------------------------------------

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found for this ID');
    }

    const customer = await this.stripeService.client.customers.create({
      name: user.name,
      email: user.email,
      phone: user.mobile ?? undefined,
      address: {
        line1: '10 Downing Street',
        city: 'London',
        state: 'Greater London',
        postal_code: 'SW1A 2AA',
        country: 'DE',
      },
    });

    let paymentIntent: Stripe.PaymentIntent;

    try {
      paymentIntent = await this.stripeService.client.paymentIntents.create({
        amount: this.toMinorUnit(totalAmount),

        currency: this.stripeCurrency,

        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },

        description: `MovieHub booking ${booking.bookingNumber}`,

        metadata: {
          bookingId: booking.id,

          bookingNumber: booking.bookingNumber,

          showId,

          userId,

          lockId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create Stripe PaymentIntent', error);

      await this.expireBooking(booking.id);

      throw new BadRequestException({
        message: 'Unable to create payment order',

        err_code: 'PAYMENT_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 14. Create internal Payment
    // ----------------------------------------------------------

    let payment;

    try {
      payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,

          provider: 'STRIPE',

          /*
           * Stripe PaymentIntent ID
           */
          providerOrderId: paymentIntent.id,

          providerPaymentId: null,

          amount: totalAmount,

          status: 'CREATED',
        },
      });
    } catch (error) {
      this.logger.error('Failed to create internal payment', error);

      /*
       * Stripe PaymentIntent already exists,
       * but DB payment creation failed.
       *
       * Cancel the PaymentIntent so it
       * cannot accidentally be paid later.
       */

      try {
        await this.stripeService.client.paymentIntents.cancel(paymentIntent.id);
      } catch (cancelError) {
        this.logger.error(
          `Failed to cancel Stripe PaymentIntent ${paymentIntent.id}`,
          cancelError,
        );
      }

      await this.expireBooking(booking.id);

      throw new BadRequestException({
        message: 'Unable to initialize payment',

        err_code: 'PAYMENT_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 15. Return frontend data
    // ----------------------------------------------------------

    return {
      success: true,

      data: {
        booking: {
          id: booking.id,

          bookingNumber: booking.bookingNumber,

          status: booking.status,

          expiresAt: booking.expiresAt,
        },

        payment: {
          id: payment.id,

          stripe: {
            paymentIntentId: paymentIntent.id,

            clientSecret: paymentIntent.client_secret,

            amount: paymentIntent.amount,

            currency: paymentIntent.currency,
          },

          amount: totalAmount,

          ticketsAmount,

          convenienceFee,

          taxes,

          discount,
        },

        show: {
          id: show.id,

          movie: {
            id: show.movie.id,

            title: show.movie.title,
          },

          theatre: {
            id: show.screen.theatre.id,

            name: show.screen.theatre.name,
          },

          screen: {
            id: show.screen.id,

            name: show.screen.name,
          },
        },

        seats: showSeats.map((seat) => ({
          id: seat.id,

          seatId: seat.seatId,

          price: Number(seat.price),
        })),
      },
    };
  }

  // ============================================================
  // VERIFY STRIPE PAYMENT
  // ============================================================

  async verifyPayment(userId: string, paymentIntentId: string) {
    // ----------------------------------------------------------
    // 1. Find internal payment
    // ----------------------------------------------------------

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: 'STRIPE',

        providerOrderId: paymentIntentId,
      },

      include: {
        booking: {
          include: {
            bookingSeats: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment intent not found',

        err_code: 'PAYMENT_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 2. Verify ownership
    // ----------------------------------------------------------

    if (payment.booking.userId !== userId) {
      throw new UnauthorizedException({
        message: 'You are not authorized to verify this payment',

        err_code: 'AUTHENTICATION_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 3. Idempotency
    // ----------------------------------------------------------

    if (
      payment.status === 'SUCCESS' &&
      payment.booking.status === 'CONFIRMED'
    ) {
      return {
        success: true,

        message: 'Payment already verified',

        data: {
          bookingId: payment.bookingId,

          paymentId: payment.id,

          status: 'SUCCESS',
        },
      };
    }

    // ----------------------------------------------------------
    // 4. Retrieve PaymentIntent from Stripe
    // ----------------------------------------------------------

    let paymentIntent: Stripe.PaymentIntent;

    try {
      paymentIntent =
        await this.stripeService.client.paymentIntents.retrieve(
          paymentIntentId,
        );
    } catch (error) {
      this.logger.error('Failed to retrieve Stripe PaymentIntent', error);

      throw new BadRequestException({
        message: 'Unable to verify payment',

        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 5. Verify PaymentIntent ownership
    // ----------------------------------------------------------

    if (paymentIntent.metadata?.bookingId !== payment.bookingId) {
      throw new BadRequestException({
        message: 'Payment does not belong to this booking',

        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 6. Verify amount
    // ----------------------------------------------------------

    const stripeAmount = Number(paymentIntent.amount) / 100;

    const internalAmount = Number(payment.amount);

    if (stripeAmount !== internalAmount) {
      throw new BadRequestException({
        message: 'Payment amount mismatch',

        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 7. Check Stripe status
    // ----------------------------------------------------------

    if (paymentIntent.status !== 'succeeded') {
      if (paymentIntent.status === 'canceled') {
        await this.markPaymentFailed(
          payment.id,
          'Stripe PaymentIntent was canceled',
        );
      }

      throw new BadRequestException({
        message: `Payment is not successful. Current status: ${paymentIntent.status}`,

        err_code: 'PAYMENT_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 8. Finalize
    // ----------------------------------------------------------

    await this.finalizePaymentFromStripe(paymentIntent);

    return {
      success: true,

      message: 'Payment verified successfully',

      data: {
        bookingId: payment.bookingId,

        paymentId: payment.id,

        stripePaymentIntentId: paymentIntent.id,

        status: 'SUCCESS',
      },
    };
  }

  // ============================================================
  // STRIPE WEBHOOK
  // ============================================================

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripeWebhookSecret) {
      throw new BadRequestException({
        message: 'Stripe webhook secret is not configured',

        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeWebhookSecret,
      );
    } catch (error) {
      this.logger.error('Invalid Stripe webhook signature', error);

      throw new BadRequestException({
        message: 'Invalid Stripe webhook signature',

        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event);
        break;

      default:
        this.logger.debug(`Ignoring Stripe event: ${event.type}`);
    }

    return {
      success: true,
    };
  }

  // ============================================================
  // PAYMENT_INTENT.SUCCEEDED
  // ============================================================

  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await this.finalizePaymentFromStripe(paymentIntent);
  }

  // ============================================================
  // PAYMENT_INTENT.PAYMENT_FAILED
  // ============================================================

  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: 'STRIPE',

        providerOrderId: paymentIntent.id,
      },
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for Stripe PaymentIntent ${paymentIntent.id}`,
      );

      return;
    }

    /*
     * Never overwrite successful payment.
     */

    if (payment.status === 'SUCCESS') {
      return;
    }

    await this.prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: 'FAILED',
      },
    });

    this.logger.warn(`Stripe payment failed: ${paymentIntent.id}`);
  }

  // ============================================================
  // PAYMENT_INTENT.CANCELED
  // ============================================================

  private async handlePaymentIntentCanceled(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: 'STRIPE',

        providerOrderId: paymentIntent.id,
      },

      include: {
        booking: true,
      },
    });

    if (!payment) {
      return;
    }

    if (payment.status === 'SUCCESS') {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'FAILED',
        },
      });
    });
  }

  // ============================================================
  // FINALIZE SUCCESSFUL STRIPE PAYMENT
  // ============================================================

  // private async finalizePaymentFromStripe(
  //   paymentIntent: Stripe.PaymentIntent,
  // ): Promise<void> {
  //   // ----------------------------------------------------------
  //   // 1. Find internal payment
  //   // ----------------------------------------------------------

  //   const payment = await this.prisma.payment.findFirst({
  //     where: {
  //       provider: 'STRIPE',

  //       providerOrderId: paymentIntent.id,
  //     },

  //     include: {
  //       booking: {
  //         include: {
  //           bookingSeats: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!payment) {
  //     this.logger.warn(
  //       `Payment not found for Stripe PaymentIntent ${paymentIntent.id}`,
  //     );

  //     return;
  //   }

  //   // ----------------------------------------------------------
  //   // 2. Idempotency
  //   // ----------------------------------------------------------

  //   if (
  //     payment.status === 'SUCCESS' &&
  //     payment.booking.status === 'CONFIRMED'
  //   ) {
  //     return;
  //   }

  //   // ----------------------------------------------------------
  //   // 3. Payment must be succeeded
  //   // ----------------------------------------------------------

  //   if (paymentIntent.status !== 'succeeded') {
  //     return;
  //   }

  //   // ----------------------------------------------------------
  //   // 4. Verify booking metadata
  //   // ----------------------------------------------------------

  //   if (paymentIntent.metadata?.bookingId !== payment.bookingId) {
  //     throw new BadRequestException({
  //       message: 'Payment does not belong to this booking',

  //       err_code: 'PAYMENT_VERIFICATION_FAILED',
  //     });
  //   }

  //   // ----------------------------------------------------------
  //   // 5. Verify amount
  //   // ----------------------------------------------------------

  //   const stripeAmount = Number(paymentIntent.amount) / 100;

  //   const internalAmount = Number(payment.amount);

  //   if (stripeAmount !== internalAmount) {
  //     this.logger.error(
  //       `Stripe payment amount mismatch. Expected=${internalAmount}, Received=${stripeAmount}`,
  //     );

  //     throw new BadRequestException({
  //       message: 'Payment amount mismatch',

  //       err_code: 'PAYMENT_VERIFICATION_FAILED',
  //     });
  //   }

  //   // ----------------------------------------------------------
  //   // 6. Re-check seat lock
  //   // ----------------------------------------------------------

  //   const booking = payment.booking;

  //   const seatIds = booking.bookingSeats.map((seat) => seat.seatId);

  //   const lockStillValid = await this.seatLockService.verifyLock(
  //     booking.showId,
  //     seatIds,
  //     booking.lockId,
  //   );

  //   this.logger.error('[Payment] Lock verification result', {
  //     bookingId: booking.id,
  //     showId: booking.showId,
  //     lockId: booking.lockId,
  //     seatIds,
  //     ttl: await this.seatLockService.getLockTtl(
  //       booking.showId,
  //       booking.lockId,
  //     ),
  //     valid: lockStillValid,
  //   });

  //   if (!lockStillValid) {
  //     this.logger.error(
  //       `Stripe payment succeeded but seat lock expired. bookingId=${booking.id}`,
  //     );

  //     /*
  //      * Payment succeeded but seats are
  //      * no longer reserved.
  //      *
  //      * DO NOT confirm booking.
  //      *
  //      * This should enter your refund/
  //      * reconciliation flow.
  //      */

  //     await this.markPaymentCapturedButBookingExpired(
  //       payment.id,
  //       booking.id,
  //       paymentIntent.id,
  //     );

  //     return;
  //   }

  //   // ----------------------------------------------------------
  //   // 7. Final transaction
  //   // ----------------------------------------------------------

  //   await this.prisma.$transaction(async (tx) => {
  //     const currentPayment = await tx.payment.findUnique({
  //       where: {
  //         id: payment.id,
  //       },
  //     });

  //     if (!currentPayment) {
  //       throw new NotFoundException({
  //         message: 'Payment not found',

  //         err_code: 'PAYMENT_FAILED',
  //       });
  //     }

  //     /*
  //      * Idempotency
  //      */

  //     if (currentPayment.status === 'SUCCESS') {
  //       return;
  //     }

  //     /*
  //      * Payment SUCCESS
  //      */

  //     await tx.payment.update({
  //       where: {
  //         id: payment.id,
  //       },

  //       data: {
  //         status: 'SUCCESS',

  //         providerPaymentId: paymentIntent.latest_charge
  //           ? String(paymentIntent.latest_charge)
  //           : paymentIntent.id,

  //         paidAt: new Date(),
  //       },
  //     });

  //     /*
  //      * Booking CONFIRMED
  //      */

  //     await tx.booking.update({
  //       where: {
  //         id: booking.id,
  //       },

  //       data: {
  //         status: 'CONFIRMED',

  //         confirmedAt: new Date(),
  //       },
  //     });

  //     /*
  //      * Seats CONFIRMED
  //      */

  //     await tx.bookingSeat.updateMany({
  //       where: {
  //         bookingId: booking.id,

  //         status: 'RESERVED',
  //       },

  //       data: {
  //         status: 'CONFIRMED',
  //       },
  //     });
  //   });

  //   // ----------------------------------------------------------
  //   // 8. Release Redis lock
  //   // ----------------------------------------------------------

  //   try {
  //     const releasedSeats = await this.seatLockService.unlockSeats(
  //       booking.showId,
  //       seatIds,
  //       booking.lockId,
  //     );

  //     this.logger.log(
  //       `Released ${releasedSeats.length} seats after successful Stripe payment. bookingId=${booking.id}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to release seat lock. bookingId=${booking.id}`,
  //       error,
  //     );
  //   }

  //   this.logger.log(
  //     `Stripe payment finalized successfully. bookingId=${booking.id}, paymentIntentId=${paymentIntent.id}`,
  //   );
  // }

  private async finalizePaymentFromStripe(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    // ----------------------------------------------------------
    // 1. Find internal payment
    // ----------------------------------------------------------

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider: 'STRIPE',
        providerOrderId: paymentIntent.id,
      },

      include: {
        booking: {
          include: {
            bookingSeats: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for Stripe PaymentIntent ${paymentIntent.id}`,
      );

      return;
    }

    // ----------------------------------------------------------
    // 2. Idempotency
    // ----------------------------------------------------------

    if (
      payment.status === 'SUCCESS' &&
      payment.booking.status === 'CONFIRMED'
    ) {
      return;
    }

    // ----------------------------------------------------------
    // 3. Payment must be succeeded
    // ----------------------------------------------------------

    if (paymentIntent.status !== 'succeeded') {
      return;
    }

    // ----------------------------------------------------------
    // 4. Verify booking metadata
    // ----------------------------------------------------------

    if (paymentIntent.metadata?.bookingId !== payment.bookingId) {
      throw new BadRequestException({
        message: 'Payment does not belong to this booking',
        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 5. Verify amount
    // ----------------------------------------------------------

    const stripeAmount = Number(paymentIntent.amount) / 100;
    const internalAmount = Number(payment.amount);

    if (stripeAmount !== internalAmount) {
      this.logger.error(
        `Stripe payment amount mismatch. Expected=${internalAmount}, Received=${stripeAmount}`,
      );

      throw new BadRequestException({
        message: 'Payment amount mismatch',
        err_code: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    // ----------------------------------------------------------
    // 6. Re-check seat lock
    // ----------------------------------------------------------

    const booking = payment.booking;

    /*
     * BookingSeat.seatId is the master Seat.id.
     *
     * Redis seat locks use ShowSeat.id.
     *
     * Therefore we must resolve:
     *
     * BookingSeat.seatId
     *       ↓
     * ShowSeat.seatId
     *       ↓
     * ShowSeat.id
     *
     * before calling Redis lock methods.
     */

    const seatIds = booking.bookingSeats.map(
      (bookingSeat) => bookingSeat.seatId,
    );

    const showSeats = await this.prisma.showSeat.findMany({
      where: {
        showId: booking.showId,

        seatId: {
          in: seatIds,
        },
      },

      select: {
        id: true,
        seatId: true,
      },
    });

    if (showSeats.length !== seatIds.length) {
      this.logger.error('[Payment] ShowSeat mapping failed', {
        bookingId: booking.id,
        showId: booking.showId,
        bookingSeatIds: seatIds,
        foundShowSeats: showSeats,
      });

      throw new BadRequestException({
        message: 'One or more booking seats are invalid',
        err_code: 'SEAT_NOT_AVAILABLE',
      });
    }

    /*
     * These are the IDs used by Redis.
     */
    const showSeatIds = showSeats.map((showSeat) => showSeat.id);

    this.logger.log('[Payment] Seat ID mapping', {
      bookingId: booking.id,
      showId: booking.showId,

      bookingSeatIds: seatIds,

      showSeatIds,
    });

    const lockStillValid = await this.seatLockService.verifyLock(
      booking.showId,
      showSeatIds,
      booking.lockId,
    );

    const lockTtl = await this.seatLockService.getLockTtl(
      booking.showId,
      booking.lockId,
    );

    this.logger.log('[Payment] Lock verification result', {
      bookingId: booking.id,
      showId: booking.showId,
      lockId: booking.lockId,

      bookingSeatIds: seatIds,
      showSeatIds,

      ttl: lockTtl,
      valid: lockStillValid,
    });

    if (!lockStillValid) {
      this.logger.error(
        `Stripe payment succeeded but seat lock expired or is invalid. bookingId=${booking.id}`,
      );

      /*
       * Payment succeeded but seats are
       * no longer reserved.
       *
       * DO NOT confirm booking.
       *
       * This should enter your refund/
       * reconciliation flow.
       */

      await this.markPaymentCapturedButBookingExpired(
        payment.id,
        booking.id,
        paymentIntent.id,
      );

      return;
    }

    // ----------------------------------------------------------
    // 7. Final transaction
    // ----------------------------------------------------------

    await this.prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: {
          id: payment.id,
        },
      });

      if (!currentPayment) {
        throw new NotFoundException({
          message: 'Payment not found',
          err_code: 'PAYMENT_FAILED',
        });
      }

      /*
       * Idempotency
       */

      if (currentPayment.status === 'SUCCESS') {
        return;
      }

      /*
       * Payment SUCCESS
       */

      await tx.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'SUCCESS',

          providerPaymentId: paymentIntent.latest_charge
            ? String(paymentIntent.latest_charge)
            : paymentIntent.id,

          paidAt: new Date(),
        },
      });

      /*
       * Booking CONFIRMED
       */

      await tx.booking.update({
        where: {
          id: booking.id,
        },

        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      /*
       * Seats CONFIRMED
       */

      await tx.bookingSeat.updateMany({
        where: {
          bookingId: booking.id,
          status: 'RESERVED',
        },

        data: {
          status: 'CONFIRMED',
        },
      });
    });

    // ----------------------------------------------------------
    // 8. Release Redis lock
    // ----------------------------------------------------------

    try {
      /*
       * Redis uses ShowSeat.id, NOT BookingSeat.seatId.
       */
      const releasedSeats = await this.seatLockService.unlockSeats(
        booking.showId,
        showSeatIds,
        booking.lockId,
      );

      this.logger.log(
        `Released ${releasedSeats.length} seats after successful Stripe payment. bookingId=${booking.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to release seat lock. bookingId=${booking.id}`,
        error,
      );
    }

    this.logger.log(
      `Stripe payment finalized successfully. bookingId=${booking.id}, paymentIntentId=${paymentIntent.id}`,
    );
  }
  // ============================================================
  // PAYMENT FAILED
  // ============================================================

  private async markPaymentFailed(paymentId: string, reason?: string) {
    await this.prisma.payment.update({
      where: {
        id: paymentId,
      },

      data: {
        status: 'FAILED',
      },
    });

    if (reason) {
      this.logger.warn(
        `Payment failed. paymentId=${paymentId}, reason=${reason}`,
      );
    }
  }

  // ============================================================
  // CAPTURED PAYMENT BUT EXPIRED LOCK
  // ============================================================

  private async markPaymentCapturedButBookingExpired(
    paymentId: string,
    bookingId: string,
    stripePaymentIntentId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: paymentId,
        },

        data: {
          status: 'SUCCESS',

          providerPaymentId: stripePaymentIntentId,

          paidAt: new Date(),
        },
      });

      await tx.booking.update({
        where: {
          id: bookingId,
        },

        data: {
          status: 'EXPIRED',

          cancelledAt: new Date(),
        },
      });

      await tx.bookingSeat.updateMany({
        where: {
          bookingId,
        },

        data: {
          status: 'EXPIRED',
        },
      });
    });

    this.logger.error(
      `Stripe payment succeeded but booking expired. Refund required. bookingId=${bookingId}, paymentIntentId=${stripePaymentIntentId}`,
    );

    /*
     * IMPORTANT:
     *
     * Add Stripe refund here in the next step:
     *
     * stripe.refunds.create({
     *   payment_intent: stripePaymentIntentId
     * })
     */
  }

  // ============================================================
  // EXPIRE BOOKING
  // ============================================================

  private async expireBooking(bookingId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
      });

      if (!booking) {
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: {
            id: bookingId,
          },

          data: {
            status: 'EXPIRED',

            cancelledAt: new Date(),
          },
        });

        await tx.bookingSeat.updateMany({
          where: {
            bookingId,
          },

          data: {
            status: 'EXPIRED',
          },
        });
      });

      const bookingSeats = await this.prisma.bookingSeat.findMany({
        where: {
          bookingId,
        },

        select: {
          seatId: true,
        },
      });

      if (bookingSeats.length > 0) {
        await this.seatLockService.unlockSeats(
          booking.showId,

          bookingSeats.map((seat) => seat.seatId),

          booking.lockId,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to expire booking ${bookingId}`, error);
    }
  }

  // ============================================================
  // CONVENIENCE FEE
  // ============================================================

  private calculateConvenienceFee(ticketsAmount: number): number {
    return Number((ticketsAmount * 0.05).toFixed(2));
  }

  // ============================================================
  // TAX
  // ============================================================

  private calculateTaxes(
    ticketsAmount: number,
    convenienceFee: number,
  ): number {
    return Number((convenienceFee * 0.18).toFixed(2));
  }

  // ============================================================
  // OFFER
  // ============================================================

  private async calculateOfferDiscount(
    offerCode: string | undefined,

    ticketsAmount: number,
  ): Promise<{
    discount: number;
    offerId: string | null;
  }> {
    if (!offerCode) {
      return {
        discount: 0,
        offerId: null,
      };
    }

    const offer = await this.prisma.offer.findFirst({
      where: {
        code: offerCode,

        isActive: true,

        startsAt: {
          lte: new Date(),
        },

        endsAt: {
          gte: new Date(),
        },
      },
    });

    if (!offer) {
      throw new BadRequestException({
        message: 'Invalid or expired offer',

        err_code: 'VALIDATION_ERROR',
      });
    }

    let discount = 0;

    if (offer.type === 'FLAT') {
      discount = Number(offer.value);
    }

    if (offer.type === 'PERCENTAGE') {
      discount = (ticketsAmount * Number(offer.value)) / 100;
    }

    discount = Math.min(discount, ticketsAmount);

    return {
      discount: Number(discount.toFixed(2)),

      offerId: offer.id,
    };
  }

  // ============================================================
  // BOOKING NUMBER
  // ============================================================

  private generateBookingNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();

    const random = crypto.randomBytes(3).toString('hex').toUpperCase();

    return `MOV-${timestamp}-${random}`;
  }

  // ============================================================
  // INR -> PAISE
  // ============================================================

  private toMinorUnit(amount: number): number {
    return Math.round(amount * 100);
  }

  // ============================================================
  // PUBLIC HELPER
  // ============================================================

  async getBookingPaymentStatus(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },

      include: {
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',

        err_code: 'BOOKING_FAILED',
      });
    }

    if (booking.userId !== userId) {
      throw new UnauthorizedException({
        message: 'You are not authorized to access this booking',

        err_code: 'AUTHENTICATION_FAILED',
      });
    }

    return {
      success: true,

      data: {
        bookingId: booking.id,

        bookingNumber: booking.bookingNumber,

        bookingStatus: booking.status,

        payment: booking.payment
          ? {
              id: booking.payment.id,

              status: booking.payment.status,

              amount: Number(booking.payment.amount),

              provider: booking.payment.provider,

              providerOrderId: booking.payment.providerOrderId,

              providerPaymentId: booking.payment.providerPaymentId,

              paidAt: booking.payment.paidAt,
            }
          : null,
      },
    };
  }
}
