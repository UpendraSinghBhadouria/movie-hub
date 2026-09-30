import { Module } from '@nestjs/common';

import { TheatresController } from './theatres.controller.js';
import { TheatresService } from './theatres.service.js';

import { ScreensController } from './screens.controller.js';
import { ScreensService } from './screens.service.js';

import { SeatsController } from './seats.controller.js';
import { SeatsService } from './seats.service.js';

@Module({
  controllers: [TheatresController, ScreensController, SeatsController],
  providers: [TheatresService, ScreensService, SeatsService],
  exports: [TheatresService, ScreensService, SeatsService],
})
export class TheatresModule {}
