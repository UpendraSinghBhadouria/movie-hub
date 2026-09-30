import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';
import {
  Genre,
  Language,
  Movie,
  MovieGenre,
  MovieLanguage,
} from '../generated/prisma/client.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      const movies = await this.prisma.movie.findMany({
        orderBy: [
          {
            promoted: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],

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
      });

      return movies.map((movie) => this.formatMovie(movie));
    } catch (error) {
      console.log(error);
    }
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id,
      },

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
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return this.formatMovie(movie);
  }

  async create(dto: CreateMovieDto) {
    const movie = await this.prisma.movie.create({
      data: {
        title: dto.title,
        description: dto.description,
        posterUrl: dto.posterUrl,
        bannerUrl: dto.bannerUrl,
        certificate: dto.certificate,

        rating: dto.rating,
        votes: dto.votes ?? 0,

        durationMin: dto.durationMin,

        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,

        promoted: dto.promoted ?? false,

        languages: {
          create: await this.createLanguages(dto.languages),
        },

        genres: {
          create: await this.createGenres(dto.genres),
        },
      },

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
    });

    return this.formatMovie(movie);
  }

  async update(id: string, dto: UpdateMovieDto) {
    const existingMovie = await this.prisma.movie.findUnique({
      where: { id },
    });

    if (!existingMovie) {
      throw new NotFoundException('Movie not found');
    }

    const movie = await this.prisma.$transaction(async (tx) => {
      if (dto.languages) {
        await tx.movieLanguage.deleteMany({
          where: {
            movieId: id,
          },
        });
      }

      if (dto.genres) {
        await tx.movieGenre.deleteMany({
          where: {
            movieId: id,
          },
        });
      }

      return tx.movie.update({
        where: {
          id,
        },

        data: {
          title: dto.title,
          description: dto.description,
          posterUrl: dto.posterUrl,
          bannerUrl: dto.bannerUrl,
          certificate: dto.certificate,
          rating: dto.rating,
          votes: dto.votes,
          durationMin: dto.durationMin,

          releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,

          promoted: dto.promoted,

          ...(dto.languages
            ? {
                languages: {
                  create: await this.createLanguages(dto.languages, tx),
                },
              }
            : {}),

          ...(dto.genres
            ? {
                genres: {
                  create: await this.createGenres(dto.genres, tx),
                },
              }
            : {}),
        },

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
      });
    });

    return this.formatMovie(movie);
  }

  async remove(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    await this.prisma.movie.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Movie deleted successfully',
    };
  }

  private async createLanguages(
    languages: string[],
    prisma: Pick<PrismaService, 'language'> = this.prisma,
  ) {
    const result = [];

    for (const name of languages) {
      const language = await prisma.language.upsert({
        where: {
          name,
        },

        update: {},

        create: {
          name,
        },
      });

      result.push({
        languageId: language.id,
      });
    }

    return result;
  }

  private async createGenres(
    genres: string[],
    prisma: Pick<PrismaService, 'genre'> = this.prisma,
  ) {
    const result = [];

    for (const name of genres) {
      const genre = await prisma.genre.upsert({
        where: {
          name,
        },

        update: {},

        create: {
          name,
        },
      });

      result.push({
        genreId: genre.id,
      });
    }

    return result;
  }

  private formatMovie(
    movie: Movie & {
      languages: ({ language: Language } & MovieLanguage)[];
      genres: ({ genre: Genre } & MovieGenre)[];
    },
  ) {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      posterUrl: movie.posterUrl,
      bannerUrl: movie.bannerUrl,
      certificate: movie.certificate,
      rating: movie.rating,
      votes: movie.votes,
      status: movie.status,
      durationMin: movie.durationMin,
      releaseDate: movie.releaseDate,
      promoted: movie.promoted,

      languages: movie.languages.map((item) => item.language.name),

      genres: movie.genres.map((item) => item.genre.name),

      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };
  }
}
