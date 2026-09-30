import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { AccessTokenGuard } from '../common/guards/access-token.guard.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/types/auth.types.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    const userId = req.user.id;

    const booking = await this.bookingService.createBooking(userId, dto);

    return {
      success: true,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async findMyBookings(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return await this.bookingService.findAllByUserId(userId);
  }

  @Get(':bookingNumber')
  @UseGuards(AccessTokenGuard)
  async findByBookingNumber(
    @Param('bookingNumber') bookingNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.bookingService.findByBookingNumber(
      user.id,
      bookingNumber,
    );
  }
}
