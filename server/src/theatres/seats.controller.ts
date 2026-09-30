import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { SeatsService } from './seats.service.js';
import { CreateSeatDto } from './dto/create-seat.dto.js';

@Controller()
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get('screens/:screenId/seats')
  findByScreen(@Param('screenId') screenId: string) {
    return this.seatsService.findByScreen(screenId);
  }

  @Post('screens/:screenId/seats')
  create(@Param('screenId') screenId: string, @Body() dto: CreateSeatDto) {
    return this.seatsService.create(screenId, dto);
  }

  @Post('screens/:screenId/seats/default-layout')
  createDefaultLayout(@Param('screenId') screenId: string) {
    return this.seatsService.createDefaultLayout(screenId);
  }
}
