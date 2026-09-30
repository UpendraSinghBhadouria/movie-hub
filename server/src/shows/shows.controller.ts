import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ShowsService } from './shows.service.js';
import { CreateShowDto } from './dto/create-show.dto.js';
import { UpdateShowDto } from './dto/update-show.dto.js';

@Controller('shows')
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Get()
  findAll(
    @Query('movieId') movieId?: string,
    @Query('theatreId') theatreId?: string,
  ) {
    if (movieId) {
      return this.showsService.findByMovie(movieId);
    }

    if (theatreId) {
      return this.showsService.findByTheatre(theatreId);
    }

    return this.showsService.findAll();
  }

  @Get('search')
  async searchShows(
    @Query('movieId') movieId?: string,
    @Query('date') date?: string,
    @Query('city') city?: string,
  ) {
    return this.showsService.searchShows({
      movieId,
      date,
      city,
    });
  }

  @Get(':id/seats')
  findSeats(@Param('id') id: string) {
    return this.showsService.findSeats(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.showsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShowDto) {
    return this.showsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShowDto) {
    return this.showsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.showsService.remove(id);
  }
}
