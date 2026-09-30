import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTheatreDto } from './dto/create-theatre.dto.js';
import { UpdateTheatreDto } from './dto/update-theatre.dto.js';

@Injectable()
export class TheatresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(city?: string) {
    const theatres = await this.prisma.theatre.findMany({
      where: city
        ? {
            city: {
              equals: city,
              mode: 'insensitive',
            },
          }
        : undefined,

      orderBy: {
        name: 'asc',
      },

      include: {
        _count: {
          select: {
            screens: true,
          },
        },
      },
    });

    return theatres.map((theatre) => ({
      id: theatre.id,
      name: theatre.name,
      brand: theatre.brand,
      address: theatre.address,
      city: theatre.city,
      state: theatre.state,
      latitude: theatre.latitude,
      longitude: theatre.longitude,
      logoUrl: theatre.logoUrl,
      cancellationAllowed: theatre.cancellationAllowed,
      screenCount: theatre._count.screens,
      createdAt: theatre.createdAt,
      updatedAt: theatre.updatedAt,
    }));
  }

  async findOne(id: string) {
    const theatre = await this.prisma.theatre.findUnique({
      where: {
        id,
      },

      include: {
        screens: {
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
        },
      },
    });

    if (!theatre) {
      throw new NotFoundException('Theatre not found');
    }

    return {
      id: theatre.id,
      name: theatre.name,
      brand: theatre.brand,
      address: theatre.address,
      city: theatre.city,
      state: theatre.state,
      latitude: theatre.latitude,
      longitude: theatre.longitude,
      logoUrl: theatre.logoUrl,
      cancellationAllowed: theatre.cancellationAllowed,

      screens: theatre.screens.map((screen) => ({
        id: screen.id,
        name: screen.name,
        seatCount: screen._count.seats,
        showCount: screen._count.shows,
      })),

      createdAt: theatre.createdAt,
      updatedAt: theatre.updatedAt,
    };
  }

  async create(dto: CreateTheatreDto) {
    const existing = await this.prisma.theatre.findUnique({
      where: {
        name_city: {
          name: dto.name,
          city: dto.city,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Theatre already exists in this city');
    }

    const theatre = await this.prisma.theatre.create({
      data: {
        name: dto.name,
        brand: dto.brand,
        address: dto.address,
        city: dto.city,
        state: dto.state,

        latitude: dto.latitude,
        longitude: dto.longitude,

        logoUrl: dto.logoUrl,

        cancellationAllowed: dto.cancellationAllowed ?? false,
      },
    });

    return theatre;
  }

  async update(id: string, dto: UpdateTheatreDto) {
    const existing = await this.prisma.theatre.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Theatre not found');
    }

    /*
     * If name or city changes, make sure
     * the unique constraint is still respected.
     */
    if (dto.name || dto.city) {
      const name = dto.name ?? existing.name;

      const city = dto.city ?? existing.city;

      const duplicate = await this.prisma.theatre.findFirst({
        where: {
          name,
          city,
          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException('Theatre already exists in this city');
      }
    }

    return this.prisma.theatre.update({
      where: {
        id,
      },

      data: {
        name: dto.name,
        brand: dto.brand,
        address: dto.address,
        city: dto.city,
        state: dto.state,

        latitude: dto.latitude,
        longitude: dto.longitude,

        logoUrl: dto.logoUrl,

        cancellationAllowed: dto.cancellationAllowed,
      },
    });
  }

  async remove(id: string) {
    const theatre = await this.prisma.theatre.findUnique({
      where: {
        id,
      },
    });

    if (!theatre) {
      throw new NotFoundException('Theatre not found');
    }

    await this.prisma.theatre.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Theatre deleted successfully',
    };
  }
}
