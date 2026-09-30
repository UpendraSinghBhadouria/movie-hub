import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShowDto } from './dto/create-show.dto.js';
import { UpdateShowDto } from './dto/update-show.dto.js';

interface SearchShowsParams {
  movieId?: string;
  date?: string;
  city?: string;
}

@Injectable()
export class ShowsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const shows = await this.prisma.show.findMany({
      orderBy: {
        startTime: 'asc',
      },

      include: {
        movie: {
          include: {
            languages: {
              include: {
                language: true,
              },
            },

            genres: {
              include: {
                genre: true,
              },
            },
          },
        },

        screen: {
          include: {
            theatre: true,
          },
        },

        _count: {
          select: {
            showSeats: true,
          },
        },
      },
    });

    return shows.map((show) => this.formatShow(show));
  }

  async searchShows({ movieId, date, city }: SearchShowsParams) {
    if (!movieId) {
      throw new BadRequestException('movieId is required');
    }

    if (!date) {
      throw new BadRequestException('date is required');
    }

    /*
     * Validate date format strictly.
     *
     * Expected:
     * YYYY-MM-DD
     */
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    /*
     * Create the start/end boundaries for the requested
     * calendar date in India (IST / UTC+05:30).
     *
     * Example:
     *
     * 2026-09-26
     *
     * start:
     * 2026-09-25T18:30:00.000Z
     *
     * end:
     * 2026-09-26T18:30:00.000Z
     *
     * The database stores DateTime values in UTC.
     */
    const startOfDay = new Date(`${date}T00:00:00.000+05:30`);

    const endOfDay = new Date(`${date}T00:00:00.000+05:30`);

    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    /*
     * Make sure the date is actually valid.
     *
     * Example of invalid dates:
     * 2026-02-31
     */
    if (
      Number.isNaN(startOfDay.getTime()) ||
      Number.isNaN(endOfDay.getTime())
    ) {
      throw new BadRequestException('Invalid date');
    }

    /*
     * Verify that the movie exists.
     */
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },

      select: {
        id: true,
        title: true,
        posterUrl: true,
        certificate: true,
        rating: true,
        durationMin: true,
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    /*
     * Find shows for the movie and requested date.
     *
     * City filtering is applied through:
     *
     * Show
     *   ↓
     * Screen
     *   ↓
     * Theatre
     *   ↓
     * city
     */
    const shows = await this.prisma.show.findMany({
      where: {
        movieId,

        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },

        ...(city
          ? {
              screen: {
                theatre: {
                  city: {
                    equals: city,
                    mode: 'insensitive',
                  },
                },
              },
            }
          : {}),
      },

      include: {
        screen: {
          include: {
            theatre: true,
          },
        },

        showSeats: {
          select: {
            id: true,
            status: true,
            price: true,
          },
        },
      },

      orderBy: [
        {
          screen: {
            theatre: {
              name: 'asc',
            },
          },
        },
        {
          startTime: 'asc',
        },
      ],
    });

    /*
     * Group shows by theatre.
     */
    const theatreMap = new Map<
      string,
      {
        theatreId: string;
        theatreName: string;
        brand: string | null;
        address: string;
        city: string;
        state: string;
        logoUrl: string | null;

        shows: Array<{
          id: string;
          screenId: string;
          screenName: string;
          startTime: Date;
          endTime: Date;
          format: string | null;
          cancellationAllowed: boolean;
          availableSeats: number;
          totalSeats: number;
          minPrice: number | null;
        }>;
      }
    >();

    /*
     * Process every show.
     */
    for (const show of shows) {
      const theatre = show.screen.theatre;

      /*
       * AVAILABLE seats can actually be selected
       * by the customer.
       */
      const availableSeats = show.showSeats.filter(
        (seat) => seat.status === 'AVAILABLE',
      ).length;

      /*
       * BLOCKED seats should not be considered
       * when calculating total seats or price.
       */
      const activeSeats = show.showSeats.filter(
        (seat) => seat.status !== 'BLOCKED',
      );

      const prices = activeSeats.map((seat) => Number(seat.price));

      const minPrice = prices.length > 0 ? Math.min(...prices) : null;

      const showData = {
        id: show.id,

        screenId: show.screen.id,

        screenName: show.screen.name,

        startTime: show.startTime,

        endTime: show.endTime,

        format: show.format,

        cancellationAllowed: show.cancellationAllowed,

        availableSeats,

        totalSeats: activeSeats.length,

        minPrice,
      };

      /*
       * Theatre already exists in the map.
       */
      const existingTheatre = theatreMap.get(theatre.id);

      if (existingTheatre) {
        existingTheatre.shows.push(showData);
        continue;
      }

      /*
       * First show for this theatre.
       */
      theatreMap.set(theatre.id, {
        theatreId: theatre.id,

        theatreName: theatre.name,

        brand: theatre.brand,

        address: theatre.address,

        city: theatre.city,

        state: theatre.state,

        logoUrl: theatre.logoUrl,

        shows: [showData],
      });
    }

    /*
     * Return the final search response.
     */
    return {
      movie,

      date,

      city: city ?? null,

      theatres: Array.from(theatreMap.values()),
    };
  }

  async findOne(id: string) {
    const show = await this.prisma.show.findUnique({
      where: {
        id,
      },

      include: {
        movie: {
          include: {
            languages: {
              include: {
                language: true,
              },
            },

            genres: {
              include: {
                genre: true,
              },
            },
          },
        },

        screen: {
          include: {
            theatre: true,
          },
        },

        _count: {
          select: {
            showSeats: true,
          },
        },
      },
    });

    if (!show) {
      throw new NotFoundException('Show not found');
    }

    return this.formatShow(show);
  }

  async findByMovie(movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const shows = await this.prisma.show.findMany({
      where: {
        movieId,
        startTime: {
          gte: new Date(),
        },
      },

      orderBy: {
        startTime: 'asc',
      },

      include: {
        movie: true,

        screen: {
          include: {
            theatre: true,
          },
        },

        _count: {
          select: {
            showSeats: true,
          },
        },
      },
    });

    return shows.map((show) => this.formatShow(show));
  }

  async findByTheatre(theatreId: string) {
    const theatre = await this.prisma.theatre.findUnique({
      where: {
        id: theatreId,
      },
    });

    if (!theatre) {
      throw new NotFoundException('Theatre not found');
    }

    const shows = await this.prisma.show.findMany({
      where: {
        screen: {
          theatreId,
        },

        startTime: {
          gte: new Date(),
        },
      },

      orderBy: {
        startTime: 'asc',
      },

      include: {
        movie: true,

        screen: {
          include: {
            theatre: true,
          },
        },

        _count: {
          select: {
            showSeats: true,
          },
        },
      },
    });

    return shows.map((show) => this.formatShow(show));
  }

  // async findSeats(id: string) {
  //   const show = await this.prisma.show.findUnique({
  //     where: {
  //       id,
  //     },

  //     include: {
  //       movie: true,

  //       screen: {
  //         include: {
  //           theatre: true,
  //         },
  //       },

  //       showSeats: {
  //         orderBy: [
  //           {
  //             seat: {
  //               row: 'asc',
  //             },
  //           },
  //           {
  //             seat: {
  //               number: 'asc',
  //             },
  //           },
  //         ],

  //         include: {
  //           seat: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!show) {
  //     throw new NotFoundException('Show not found');
  //   }

  //   const sections = ['NORMAL', 'EXECUTIVE', 'PREMIUM'].map((category) => {
  //     const categorySeats = show.showSeats.filter(
  //       (showSeat) => showSeat.seat.category === category,
  //     );

  //     return {
  //       category,
  //       price: categorySeats.length > 0 ? Number(categorySeats[0].price) : 0,
  //       seatCount: categorySeats.length,
  //     };
  //   });

  //   return {
  //     show: {
  //       id: show.id,
  //       startTime: show.startTime,
  //       endTime: show.endTime,
  //       format: show.format,
  //       cancellationAllowed: show.cancellationAllowed,
  //     },

  //     movie: {
  //       id: show.movie.id,
  //       title: show.movie.title,
  //       posterUrl: show.movie.posterUrl,
  //       certificate: show.movie.certificate,
  //       rating: show.movie.rating,
  //     },

  //     theatre: {
  //       id: show.screen.theatre.id,
  //       name: show.screen.theatre.name,
  //       brand: show.screen.theatre.brand,
  //       address: show.screen.theatre.address,
  //       city: show.screen.theatre.city,
  //     },

  //     screen: {
  //       id: show.screen.id,
  //       name: show.screen.name,
  //     },

  //     sections,

  //     seats: show.showSeats.map((showSeat) => ({
  //       id: showSeat.id,
  //       seatId: showSeat.seat.id,
  //       row: showSeat.seat.row,
  //       number: showSeat.seat.number,
  //       category: showSeat.seat.category,
  //       price: Number(showSeat.price),
  //       status: showSeat.status,
  //     })),
  //   };
  // }

  async findSeats(id: string) {
    const show = await this.prisma.show.findUnique({
      where: {
        id,
      },

      include: {
        movie: true,

        screen: {
          include: {
            theatre: true,
          },
        },

        showSeats: {
          orderBy: [
            {
              seat: {
                row: 'asc',
              },
            },
            {
              seat: {
                number: 'asc',
              },
            },
          ],

          include: {
            seat: true,
          },
        },
      },
    });

    if (!show) {
      throw new NotFoundException('Show not found');
    }

    /*
     * Find seats that are already part of an active booking
     * for this specific show.
     *
     * IMPORTANT:
     * BookingSeat.seatId = Seat.id
     * ShowSeat.id is a different ID.
     */
    const bookedSeats = await this.prisma.bookingSeat.findMany({
      where: {
        showId: show.id,

        status: {
          in: ['RESERVED', 'CONFIRMED'],
        },

        booking: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      },

      select: {
        seatId: true,
        status: true,
      },
    });

    /*
     * We use Seat.id here because BookingSeat.seatId
     * references the master Seat table.
     */
    const bookedSeatIds = new Set(
      bookedSeats.map((bookingSeat) => bookingSeat.seatId),
    );

    const sections = ['NORMAL', 'EXECUTIVE', 'PREMIUM'].map((category) => {
      const categorySeats = show.showSeats.filter(
        (showSeat) => showSeat.seat.category === category,
      );

      return {
        category,
        price: categorySeats.length > 0 ? Number(categorySeats[0].price) : 0,
        seatCount: categorySeats.length,
      };
    });

    return {
      show: {
        id: show.id,
        startTime: show.startTime,
        endTime: show.endTime,
        format: show.format,
        cancellationAllowed: show.cancellationAllowed,
      },

      movie: {
        id: show.movie.id,
        title: show.movie.title,
        posterUrl: show.movie.posterUrl,
        certificate: show.movie.certificate,
        rating: show.movie.rating,
      },

      theatre: {
        id: show.screen.theatre.id,
        name: show.screen.theatre.name,
        brand: show.screen.theatre.brand,
        address: show.screen.theatre.address,
        city: show.screen.theatre.city,
      },

      screen: {
        id: show.screen.id,
        name: show.screen.name,
      },

      sections,

      seats: show.showSeats.map((showSeat) => ({
        /*
         * IMPORTANT:
         * Frontend/Redis uses ShowSeat.id.
         */
        id: showSeat.id,

        /*
         * Master Seat.id.
         * Useful for reference but should NOT be used
         * for Redis seat locking.
         */
        seatId: showSeat.seat.id,

        row: showSeat.seat.row,
        number: showSeat.seat.number,
        category: showSeat.seat.category,
        price: Number(showSeat.price),

        /*
         * BookingSeat uses Seat.id, so check against
         * bookedSeatIds using showSeat.seat.id.
         */
        status: bookedSeatIds.has(showSeat.seat.id) ? 'booked' : 'available',
      })),
    };
  }
  async create(dto: CreateShowDto) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: dto.movieId,
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const screen = await this.prisma.screen.findUnique({
      where: {
        id: dto.screenId,
      },
      include: {
        theatre: true,
        seats: true,
      },
    });

    if (!screen) {
      throw new NotFoundException('Screen not found');
    }

    /*
     * Convert ISO strings to Date objects.
     *
     * The incoming value should contain a timezone.
     *
     * Example:
     * 2026-09-26T19:30:00+05:30
     *
     * JavaScript converts this to:
     * 2026-09-26T14:00:00.000Z
     */
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    /*
     * Validate parsed dates.
     */
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException(
        'startTime and endTime must be valid ISO date strings',
      );
    }

    /*
     * End time must be after start time.
     */
    if (endTime <= startTime) {
      throw new ConflictException('End time must be after start time');
    }

    /*
     * Prevent two shows from starting at
     * exactly the same time on one screen.
     */
    const existing = await this.prisma.show.findUnique({
      where: {
        screenId_startTime: {
          screenId: dto.screenId,
          startTime,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A show already exists at this time');
    }

    /*
     * Check for overlapping shows.
     */
    const overlapping = await this.prisma.show.findFirst({
      where: {
        screenId: dto.screenId,

        startTime: {
          lt: endTime,
        },

        endTime: {
          gt: startTime,
        },
      },
    });

    if (overlapping) {
      throw new ConflictException(
        'Show overlaps with an existing show on this screen',
      );
    }

    /*
     * Create show + ShowSeat records atomically.
     */
    const show = await this.prisma.$transaction(async (tx) => {
      const createdShow = await tx.show.create({
        data: {
          movieId: dto.movieId,
          screenId: dto.screenId,
          startTime,
          endTime,
          format: dto.format,
          cancellationAllowed:
            dto.cancellationAllowed ?? screen.theatre.cancellationAllowed,
        },
      });

      if (screen.seats.length > 0) {
        await tx.showSeat.createMany({
          data: screen.seats.map((seat) => ({
            showId: createdShow.id,
            seatId: seat.id,
            status: seat.status === 'BLOCKED' ? 'BLOCKED' : 'AVAILABLE',
            price: seat.price,
          })),
        });
      }

      return createdShow;
    });

    return this.findOne(show.id);
  }

  async update(id: string, dto: UpdateShowDto) {
    const existing = await this.prisma.show.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Show not found');
    }

    /*
     * We don't allow changing movie/screen
     * after ShowSeat records exist.
     *
     * In a real production system, you would
     * usually cancel/recreate the show instead.
     */
    if (dto.movieId && dto.movieId !== existing.movieId) {
      throw new ConflictException(
        'Movie cannot be changed after show creation',
      );
    }

    if (dto.screenId && dto.screenId !== existing.screenId) {
      throw new ConflictException(
        'Screen cannot be changed after show creation',
      );
    }

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : existing.startTime;

    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;

    if (endTime <= startTime) {
      throw new ConflictException('End time must be after start time');
    }

    return this.prisma.show.update({
      where: {
        id,
      },

      data: {
        startTime,
        endTime,
        format: dto.format,
        cancellationAllowed: dto.cancellationAllowed,
      },

      include: {
        movie: true,

        screen: {
          include: {
            theatre: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const show = await this.prisma.show.findUnique({
      where: {
        id,
      },
    });

    if (!show) {
      throw new NotFoundException('Show not found');
    }

    await this.prisma.show.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Show deleted successfully',
    };
  }

  private formatShow(show: any) {
    return {
      id: show.id,

      movie: {
        id: show.movie.id,
        title: show.movie.title,
        posterUrl: show.movie.posterUrl,
        certificate: show.movie.certificate,
        rating: show.movie.rating,

        languages:
          show.movie.languages?.map((item: any) => item.language.name) ?? [],

        genres: show.movie.genres?.map((item: any) => item.genre.name) ?? [],
      },

      theatre: {
        id: show.screen.theatre.id,
        name: show.screen.theatre.name,
        brand: show.screen.theatre.brand,
        address: show.screen.theatre.address,
        city: show.screen.theatre.city,
      },

      screen: {
        id: show.screen.id,
        name: show.screen.name,
      },

      startTime: show.startTime,
      endTime: show.endTime,
      format: show.format,
      cancellationAllowed: show.cancellationAllowed,

      seatCount: show._count?.showSeats ?? 0,

      createdAt: show.createdAt,
    };
  }
}
