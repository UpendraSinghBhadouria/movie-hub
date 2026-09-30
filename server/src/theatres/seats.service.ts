import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSeatDto } from './dto/create-seat.dto.js';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByScreen(screenId: string) {
    const screen = await this.prisma.screen.findUnique({
      where: {
        id: screenId,
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    const seats = await this.prisma.seat.findMany({
      where: {
        screenId,
      },

      orderBy: [
        {
          row: 'asc',
        },
        {
          number: 'asc',
        },
      ],
    });

    return seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      price: Number(seat.price),
      status: seat.status,
    }));
  }

  async create(screenId: string, dto: CreateSeatDto) {
    const screen = await this.prisma.screen.findUnique({
      where: {
        id: screenId,
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    const existing = await this.prisma.seat.findUnique({
      where: {
        screenId_row_number: {
          screenId,
          row: dto.row,
          number: dto.number,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Seat already exists');
    }

    return this.prisma.seat.create({
      data: {
        screenId,
        row: dto.row,
        number: dto.number,
        category: dto.category,
        price: dto.price,
      },
    });
  }

  async createDefaultLayout(screenId: string) {
    const screen = await this.prisma.screen.findUnique({
      where: {
        id: screenId,
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    const existingCount = await this.prisma.seat.count({
      where: {
        screenId,
      },
    });

    if (existingCount > 0) {
      throw new ConflictException('Seats already exist for this screen');
    }

    const layout = [
      {
        rows: ['A', 'B'],
        seatsPerRow: 10,
        category: 'NORMAL' as const,
        price: 220,
      },

      {
        rows: ['C', 'D', 'E'],
        seatsPerRow: 10,
        category: 'EXECUTIVE' as const,
        price: 320,
      },

      {
        rows: ['F', 'G', 'H', 'I'],
        seatsPerRow: 12,
        category: 'PREMIUM' as const,
        price: 420,
      },
    ];

    const seats = [];

    for (const section of layout) {
      for (const row of section.rows) {
        for (let number = 1; number <= section.seatsPerRow; number++) {
          seats.push({
            screenId,
            row,
            number,
            category: section.category,
            price: section.price,
          });
        }
      }
    }

    await this.prisma.seat.createMany({
      data: seats,
    });

    return {
      message: 'Default seat layout created',
      seatCount: seats.length,
    };
  }
}
