import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BOOKING_CONSTANTS } from './constants/booking.contants.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SeatLockService } from '../seat-lock/seat-lock.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ERROR_CODES } from '../common/constants/error-codes.constants.js';
import { BookingSeatStatus, BookingStatus } from '../generated/prisma/enums.js';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seatLockService: SeatLockService,
  ) {}

  async createBooking(userId: string, dto: CreateBookingDto) {
    const { showId, lockId, seatIds, offerId } = dto;

    /*
     * 1. Validate user
     */
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        err_code: ERROR_CODES.USER_NOT_FOUND,
      });
    }

    /*
     * 2. Validate seat IDs
     *
     * Do not allow duplicate seat IDs.
     */
    const uniqueSeatIds = [...new Set(seatIds)];

    if (uniqueSeatIds.length === 0 || uniqueSeatIds.length !== seatIds.length) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid or duplicate seat selection',
        err_code: ERROR_CODES.SEAT_NOT_AVAILABLE,
      });
    }

    /*
     * 3. Validate show
     */
    const show = await this.prisma.show.findUnique({
      where: {
        id: showId,
      },
      include: {
        movie: true,
        theatre: true,
        screen: true,
      },
    });

    if (!show) {
      throw new NotFoundException({
        success: false,
        message: 'Show not found',
        err_code: ERROR_CODES.SHOW_NOT_FOUND,
      });
    }

    /*
     * 4. Validate Redis seat lock
     *
     * The lock must still exist when the booking is created.
     */
    const lockTtl = await this.seatLockService.getLockTtl(showId, lockId);

    if (lockTtl <= BOOKING_CONSTANTS.MIN_LOCK_TTL_SECONDS) {
      throw new BadRequestException({
        success: false,
        message: 'Seat lock has expired or is about to expire',
        err_code: ERROR_CODES.BOOKING_EXPIRED,
      });
    }

    /*
     * 5. Validate seats belong to this show's screen
     *
     * Never trust seat IDs coming from the frontend.
     */
    const seats = await this.prisma.seat.findMany({
      where: {
        id: {
          in: uniqueSeatIds,
        },
        screenId: show.screenId,
      },
      select: {
        id: true,
        seatNumber: true,
        category: true,
        price: true,
        status: true,
      },
    });

    /*
     * Make sure every requested seat belongs to
     * the screen associated with this show.
     */
    if (seats.length !== uniqueSeatIds.length) {
      throw new BadRequestException({
        success: false,
        message: 'One or more selected seats do not belong to this show',
        err_code: ERROR_CODES.SEAT_NOT_AVAILABLE,
      });
    }

    /*
     * 6. Check blocked seats
     */
    const blockedSeat = seats.find((seat) => seat.status === 'BLOCKED');

    if (blockedSeat) {
      throw new BadRequestException({
        success: false,
        message: `Seat ${blockedSeat.seatNumber} is blocked`,
        err_code: ERROR_CODES.SEAT_NOT_AVAILABLE,
      });
    }

    /*
     * 7. Prevent duplicate active bookings
     *
     * This protects against a stale Redis lock or
     * concurrent booking request.
     */
    const existingBookingSeats = await this.prisma.bookingSeat.findMany({
      where: {
        seatId: {
          in: uniqueSeatIds,
        },
        showId,
        status: {
          in: [BookingSeatStatus.RESERVED, BookingSeatStatus.CONFIRMED],
        },
        booking: {
          showId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      },
      select: {
        seatId: true,
      },
    });

    if (existingBookingSeats.length > 0) {
      throw new BadRequestException({
        success: false,
        message: 'One or more selected seats are already booked',
        err_code: ERROR_CODES.SEAT_ALREADY_BOOKED,
      });
    }

    /*
     * 8. Calculate seat subtotal
     *
     * IMPORTANT:
     * Prices are taken from the database.
     * Never trust prices sent by the frontend.
     */
    const subtotal = seats.reduce(
      (total, seat) => total + Number(seat.price),
      0,
    );

    /*
     * 9. Apply offer
     */
    let discount = 0;

    if (offerId) {
      discount = await this.calculateOfferDiscount(offerId, subtotal);
    }

    const totalAmount = Math.max(0, subtotal - discount);

    /*
     * 10. Generate booking number
     */
    const bookingNumber = await this.generateBookingNumber();

    /*
     * 11. Create booking
     *
     * Booking starts as PENDING.
     *
     * PaymentService will:
     *
     * 1. Create Stripe PaymentIntent
     * 2. Return clientSecret to frontend
     * 3. Wait for Stripe payment
     * 4. Confirm booking after successful payment
     */
    const booking = await this.prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          showId,
          lockId,

          ticketsAmount: seats.length,

          discount,
          convenienceFee: 0,
          taxes: 0,
          totalAmount,

          status: BookingStatus.PENDING,

          ...(offerId
            ? {
                offerId,
              }
            : {}),
        },
      });

      /*
       * Reserve seats for this booking.
       *
       * They will remain RESERVED until
       * Stripe payment succeeds.
       */
      await tx.bookingSeat.createMany({
        data: seats.map((seat) => ({
          bookingId: createdBooking.id,
          showId,
          seatId: seat.id,
          price: seat.price,
          status: BookingSeatStatus.RESERVED,
        })),
      });

      return createdBooking;
    });

    /*
     * 12. Return booking details
     *
     * PaymentService will use bookingId to create
     * the Stripe PaymentIntent.
     */
    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,

      show: {
        id: show.id,
        movieId: show.movieId,
        theatreId: show.screen.theatreId,
        screenId: show.screenId,
        startTime: show.startTime,
      },

      seats: seats.map((seat) => ({
        id: seat.id,
        seatNumber: seat.seatNumber,
        category: seat.category,
        price: Number(seat.price),
      })),

      pricing: {
        subtotal,
        discount,
        totalAmount,
      },

      status: booking.status,

      lock: {
        lockId,
        remainingSeconds: lockTtl,
      },
    };
  }

  async findAllByUserId(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: {
                theatre: true,
              },
            },
          },
        },

        bookingSeats: {
          include: {
            seat: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },

        payment: true,

        offer: true,
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.bookingNumber,

      status: booking.status,

      amount: {
        tickets: Number(booking.ticketsAmount),
        convenienceFee: Number(booking.convenienceFee),
        taxes: Number(booking.taxes),
        discount: Number(booking.discount),
        total: Number(booking.totalAmount),
      },

      show: {
        id: booking.show.id,
        startTime: booking.show.startTime,
        endTime: booking.show.endTime,
        format: booking.show.format,
        cancellationAllowed: booking.show.cancellationAllowed,
      },

      movie: {
        id: booking.show.movie.id,
        title: booking.show.movie.title,
        posterUrl: booking.show.movie.posterUrl,
        certificate: booking.show.movie.certificate,
        rating: booking.show.movie.rating,
      },

      theatre: {
        id: booking.show.screen.theatre.id,
        name: booking.show.screen.theatre.name,
        brand: booking.show.screen.theatre.brand,
        address: booking.show.screen.theatre.address,
        city: booking.show.screen.theatre.city,
      },

      screen: {
        id: booking.show.screen.id,
        name: booking.show.screen.name,
      },

      seats: booking.bookingSeats.map((bookingSeat) => ({
        id: bookingSeat.id,

        // Master Seat ID
        seatId: bookingSeat.seatId,

        row: bookingSeat.seat.row,
        number: bookingSeat.seat.number,
        category: bookingSeat.seat.category,

        price: Number(bookingSeat.price),
        status: bookingSeat.status,
      })),

      payment: booking.payment
        ? {
            id: booking.payment.id,
            provider: booking.payment.provider,
            providerOrderId: booking.payment.providerOrderId,
            providerPaymentId: booking.payment.providerPaymentId,
            amount: Number(booking.payment.amount),
            status: booking.payment.status,
            method: booking.payment.method,
            paidAt: booking.payment.paidAt,
          }
        : null,

      offer: booking.offer
        ? {
            id: booking.offer.id,
            code: booking.offer.code,
            type: booking.offer.type,
          }
        : null,

      expiresAt: booking.expiresAt,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      createdAt: booking.createdAt,
    }));
  }

  async findByBookingNumber(userId: string, bookingNumber: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        bookingNumber,
        userId,
      },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: {
                theatre: true,
              },
            },
          },
        },

        bookingSeats: {
          include: {
            seat: true,
          },
          orderBy: [
            {
              seat: {
                row: 'asc',
              },
            },
            {
              seat: {
                number: 'asc',
              },
            },
          ],
        },

        payment: true,

        offer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        err_code: ERROR_CODES.BOOKING_NOT_FOUND,
      });
    }

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,

      amount: {
        tickets: Number(booking.ticketsAmount),
        convenienceFee: Number(booking.convenienceFee),
        taxes: Number(booking.taxes),
        discount: Number(booking.discount),
        total: Number(booking.totalAmount),
      },

      show: {
        id: booking.show.id,
        startTime: booking.show.startTime,
        endTime: booking.show.endTime,
        format: booking.show.format,
        cancellationAllowed: booking.show.cancellationAllowed,
      },

      movie: {
        id: booking.show.movie.id,
        title: booking.show.movie.title,
        posterUrl: booking.show.movie.posterUrl,
        certificate: booking.show.movie.certificate,
        rating: Number(booking.show.movie.rating),
      },

      theatre: {
        id: booking.show.screen.theatre.id,
        name: booking.show.screen.theatre.name,
        brand: booking.show.screen.theatre.brand,
        address: booking.show.screen.theatre.address,
        city: booking.show.screen.theatre.city,
      },

      screen: {
        id: booking.show.screen.id,
        name: booking.show.screen.name,
      },

      seats: booking.bookingSeats.map((bookingSeat) => ({
        id: bookingSeat.id,
        seatId: bookingSeat.seatId,
        row: bookingSeat.seat.row,
        number: bookingSeat.seat.number,
        category: bookingSeat.seat.category,
        price: Number(bookingSeat.price),
        status: bookingSeat.status,
      })),

      payment: booking.payment
        ? {
            id: booking.payment.id,
            provider: booking.payment.provider,
            providerOrderId: booking.payment.providerOrderId,
            providerPaymentId: booking.payment.providerPaymentId,
            amount: Number(booking.payment.amount),
            status: booking.payment.status,
            method: booking.payment.method,
            paidAt: booking.payment.paidAt,
          }
        : null,

      offer: booking.offer
        ? {
            id: booking.offer.id,
            code: booking.offer.code,
            type: booking.offer.type,
          }
        : null,

      expiresAt: booking.expiresAt,
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
      createdAt: booking.createdAt,
    };
  }

  private async calculateOfferDiscount(
    offerId: string,
    subtotal: number,
  ): Promise<number> {
    const offer = await this.prisma.offer.findUnique({
      where: {
        id: offerId,
      },
    });

    /*
     * If the offer no longer exists,
     * simply don't apply a discount.
     */
    if (!offer) {
      return 0;
    }

    /*
     * Flat discount
     */
    if (offer.type === 'FLAT') {
      return Math.min(Number(offer.value), subtotal);
    }

    /*
     * Percentage discount
     */
    if (offer.type === 'PERCENTAGE') {
      return Math.min((subtotal * Number(offer.value)) / 100, subtotal);
    }

    return 0;
  }

  private async generateBookingNumber(): Promise<string> {
    const timestamp = Date.now();

    const random = Math.floor(1000 + Math.random() * 9000);

    return `${BOOKING_CONSTANTS.BOOKING_NUMBER_PREFIX}-${timestamp}-${random}`;
  }
}
