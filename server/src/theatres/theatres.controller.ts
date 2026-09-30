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

import { TheatresService } from './theatres.service.js';
import { CreateTheatreDto } from './dto/create-theatre.dto.js';
import { UpdateTheatreDto } from './dto/update-theatre.dto.js';

@Controller('theatres')
export class TheatresController {
  constructor(private readonly theatresService: TheatresService) {}

  @Get()
  findAll(@Query('city') city?: string) {
    return this.theatresService.findAll(city);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.theatresService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTheatreDto) {
    return this.theatresService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTheatreDto) {
    return this.theatresService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.theatresService.remove(id);
  }
}
