import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      this.logger.log(
        `[${req.method}] ${req.originalUrl} ${res.statusCode} ${duration.toFixed(2)}ms`,
      );
    });

    next();
  }
}
