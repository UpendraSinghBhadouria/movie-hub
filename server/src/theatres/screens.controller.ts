import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ScreensService } from './screens.service.js';
import { CreateScreenDto } from './dto/create-screen.dto.js';
import { UpdateScreenDto } from './dto/update-screen.dto.js';

@Controller()
export class ScreensController {
  constructor(private readonly screensService: ScreensService) {}

  @Get('theatres/:theatreId/screens')
  findByTheatre(@Param('theatreId') theatreId: string) {
    return this.screensService.findByTheatre(theatreId);
  }

  @Post('theatres/:theatreId/screens')
  create(@Param('theatreId') theatreId: string, @Body() dto: CreateScreenDto) {
    return this.screensService.create(theatreId, dto);
  }

  @Get('screens/:id')
  findOne(@Param('id') id: string) {
    return this.screensService.findOne(id);
  }

  @Patch('screens/:id')
  update(@Param('id') id: string, @Body() dto: UpdateScreenDto) {
    return this.screensService.update(id, dto);
  }

  @Delete('screens/:id')
  remove(@Param('id') id: string) {
    return this.screensService.remove(id);
  }
}
