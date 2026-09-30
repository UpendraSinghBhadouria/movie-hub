import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateScreenDto } from './dto/create-screen.dto.js';
import { UpdateScreenDto } from './dto/update-screen.dto.js';

@Injectable()
export class ScreensService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTheatre(theatreId: string) {
    await this.ensureTheatreExists(theatreId);

    return this.prisma.screen.findMany({
      where: {
        theatreId,
      },

      orderBy: {
        name: 'asc',
      },

      include: {
        _count: {
          select: {
            seats: true,
            shows: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const screen = await this.prisma.screen.findUnique({
      where: {
        id,
      },

      include: {
        theatre: true,

        seats: {
          orderBy: [
            {
              row: 'asc',
            },
            {
              number: 'asc',
            },
          ],
        },

        _count: {
          select: {
            shows: true,
          },
        },
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    return {
      id: screen.id,
      name: screen.name,

      theatre: {
        id: screen.theatre.id,
        name: screen.theatre.name,
        brand: screen.theatre.brand,
        city: screen.theatre.city,
      },

      seatCount: screen.seats.length,
      showCount: screen._count.shows,

      seats: screen.seats.map((seat) => ({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        price: Number(seat.price),
        status: seat.status,
      })),
    };
  }

  async create(theatreId: string, dto: CreateScreenDto) {
    await this.ensureTheatreExists(theatreId);

    const existing = await this.prisma.screen.findUnique({
      where: {
        theatreId_name: {
          theatreId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Screen already exists in this theatre');
    }

    return this.prisma.screen.create({
      data: {
        name: dto.name,
        theatreId,
      },
    });
  }

  async update(id: string, dto: UpdateScreenDto) {
    const screen = await this.prisma.screen.findUnique({
      where: {
        id,
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    if (dto.name) {
      const duplicate = await this.prisma.screen.findFirst({
        where: {
          theatreId: screen.theatreId,
          name: dto.name,
          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException('Screen already exists in this theatre');
      }
    }

    return this.prisma.screen.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
      },
    });
  }

  async remove(id: string) {
    const screen = await this.prisma.screen.findUnique({
      where: {
        id,
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    await this.prisma.screen.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Screen deleted successfully',
    };
  }

  private async ensureTheatreExists(theatreId: string) {
    const theatre = await this.prisma.theatre.findUnique({
      where: {
        id: theatreId,
      },
    });

    if (!theatre) {
      throw new NotFoundException('Theatre not found');
    }
  }
}
