// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from '../src/generated/prisma/client.js';

// const prisma = new PrismaClient({
//   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
// });

// const movies = [
//   {
//     title: 'Maa',
//     description:
//       'A mythological fantasy horror thriller filled with mystery and supernatural elements.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m1_cwyg1p.avif',
//     bannerUrl: '/images/banner1.jpg',
//     certificate: 'UA16+',
//     rating: 7.2,
//     votes: 2700,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 135,
//     releaseDate: new Date('2026-06-01'),
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Fantasy', 'Horror', 'Mythological', 'Thriller'],
//   },

//   {
//     title: 'Kannappa',
//     description:
//       'A mythological action drama based on the legendary devotee Kannappa.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m2_rgn7kz.avif',
//     bannerUrl: '/images/banner2.jpg',
//     certificate: 'UA13+',
//     rating: 7.3,
//     votes: 10700,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 145,
//     releaseDate: new Date('2026-06-27'),
//     promoted: true,
//     languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
//     genres: ['Action', 'Drama', 'Fantasy', 'Mythological'],
//   },

//   {
//     title: 'Mission: Impossible - The Final Reckoning',
//     description:
//       'An action-packed spy thriller following Ethan Hunt on his final mission.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m3_nyinai.avif',
//     bannerUrl: '/images/banner3.jpg',
//     certificate: 'UA13+',
//     rating: 8.6,
//     votes: 84100,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 169,
//     releaseDate: new Date('2026-05-23'),
//     promoted: true,
//     languages: ['English', 'Hindi', 'Telugu', 'Tamil'],
//     genres: ['Action', 'Adventure', 'Thriller'],
//   },

//   {
//     title: 'Final Destination: Blood Lines',
//     description:
//       'A supernatural horror thriller where a group of people attempt to escape a deadly fate.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m4_namhgc.avif',
//     bannerUrl: '/images/banner4.jpg',
//     certificate: 'A',
//     rating: 7.1,
//     votes: 25400,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 110,
//     releaseDate: new Date('2026-05-16'),
//     promoted: false,
//     languages: ['English', 'Hindi'],
//     genres: ['Horror', 'Thriller', 'Mystery'],
//   },

//   {
//     title: 'How to Train Your Dragon',
//     description:
//       'An adventurous fantasy story about a young Viking and his extraordinary dragon companion.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m5_wtxyjp.avif',
//     bannerUrl: '/images/banner1.jpg',
//     certificate: 'UA',
//     rating: 8.1,
//     votes: 32100,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 125,
//     releaseDate: new Date('2026-06-13'),
//     promoted: false,
//     languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
//     genres: ['Adventure', 'Fantasy', 'Action', 'Family'],
//   },

//   {
//     title: 'Housefull 5',
//     description:
//       'A comedy mystery packed with chaos, unexpected twists and hilarious situations.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m6_awtk9b.avif',
//     bannerUrl: '/images/banner2.jpg',
//     certificate: 'UA',
//     rating: 6.8,
//     votes: 18200,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 145,
//     releaseDate: new Date('2026-06-06'),
//     promoted: false,
//     languages: ['Hindi'],
//     genres: ['Comedy', 'Drama', 'Mystery'],
//   },

//   {
//     title: 'Thudarum',
//     description:
//       'A Malayalam family drama with an emotional story and unexpected turns.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m7_sq5xzw.avif',
//     bannerUrl: '/images/banner3.jpg',
//     certificate: 'UA13+',
//     rating: 8.2,
//     votes: 14300,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 155,
//     releaseDate: new Date('2026-04-25'),
//     promoted: false,
//     languages: ['Malayalam', 'Hindi'],
//     genres: ['Drama', 'Thriller', 'Family'],
//   },

//   {
//     title: 'Retro',
//     description:
//       'A stylish action drama combining romance, crime and intense family conflicts.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m8_ilejv2.avif',
//     bannerUrl: '/images/banner4.jpg',
//     certificate: 'UA16+',
//     rating: 7.5,
//     votes: 11600,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 142,
//     releaseDate: new Date('2026-05-01'),
//     promoted: false,
//     languages: ['Tamil', 'Hindi', 'Telugu'],
//     genres: ['Action', 'Drama', 'Romance', 'Thriller'],
//   },

//   {
//     title: 'Karate Kid: Legends',
//     description:
//       'A young martial artist learns discipline, friendship and courage from legendary mentors.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m9_fq3ytb.avif',
//     bannerUrl: '/images/banner1.jpg',
//     certificate: 'UA13+',
//     rating: 7.7,
//     votes: 19800,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 118,
//     releaseDate: new Date('2026-05-30'),
//     promoted: false,
//     languages: ['English', 'Hindi'],
//     genres: ['Action', 'Drama', 'Sport'],
//   },

//   {
//     title: 'Sitaare Zameen Par',
//     description:
//       'An emotional sports drama about friendship, teamwork and finding confidence through basketball.',
//     posterUrl: 'https://res.cloudinary.com/dg9cquxqk/image/upload/m10_s6s16m.avif',
//     bannerUrl: '/images/banner2.jpg',
//     certificate: 'UA',
//     rating: 8.4,
//     votes: 35600,
//     status: 'NOW_SHOWING' as const,
//     durationMin: 155,
//     releaseDate: new Date('2026-06-20'),
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Comedy', 'Drama', 'Sport'],
//   },
// ];

// async function main() {
//   console.log('🌱 Starting movie seed...');

//   /*
//    * Clear only movie-related data.
//    *
//    * This is useful during development.
//    * Do NOT use this approach in production.
//    */
//   await prisma.movieLanguage.deleteMany();
//   await prisma.movieGenre.deleteMany();
//   await prisma.movie.deleteMany();

//   /*
//    * Create languages.
//    */
//   const languageNames = [
//     ...new Set(movies.flatMap((movie) => movie.languages)),
//   ];

//   const languages = new Map<string, string>();

//   for (const name of languageNames) {
//     const language = await prisma.language.upsert({
//       where: {
//         name,
//       },
//       update: {},
//       create: {
//         name,
//       },
//     });

//     languages.set(name, language.id);
//   }

//   /*
//    * Create genres.
//    */
//   const genreNames = [...new Set(movies.flatMap((movie) => movie.genres))];

//   const genres = new Map<string, string>();

//   for (const name of genreNames) {
//     const genre = await prisma.genre.upsert({
//       where: {
//         name,
//       },
//       update: {},
//       create: {
//         name,
//       },
//     });

//     genres.set(name, genre.id);
//   }

//   /*
//    * Create movies.
//    */
//   for (const movie of movies) {
//     await prisma.movie.create({
//       data: {
//         title: movie.title,
//         description: movie.description,
//         posterUrl: movie.posterUrl,
//         bannerUrl: movie.bannerUrl,
//         certificate: movie.certificate,
//         rating: movie.rating,
//         votes: movie.votes,
//         status: movie.status,
//         durationMin: movie.durationMin,
//         releaseDate: movie.releaseDate,
//         promoted: movie.promoted,

//         languages: {
//           create: movie.languages.map((name) => ({
//             languageId: languages.get(name)!,
//           })),
//         },

//         genres: {
//           create: movie.genres.map((name) => ({
//             genreId: genres.get(name)!,
//           })),
//         },
//       },
//     });

//     console.log(`✅ Created: ${movie.title}`);
//   }

//   console.log(`\n🎬 Successfully seeded ${movies.length} movies.`);
// }

// main()
//   .catch((error) => {
//     console.error('❌ Seed failed:', error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * Pass the movie ID when running the seed:
 *
 * Windows PowerShell:
 *
 * $env:MOVIE_ID="your-movie-id"
 * pnpm prisma db seed
 *
 * Or:
 *
 * $env:MOVIE_ID="your-movie-id"; pnpm prisma db seed
 */

const MOVIE_ID = 'cmui9hubx00048curabxm5jp9';

if (!MOVIE_ID) {
  throw new Error('MOVIE_ID is required. Example: $env:MOVIE_ID="cmxxxxxx"');
}

/**
 * Show timings.
 *
 * These are local IST times.
 *
 * 10:00 AM
 * 1:30 PM
 * 5:00 PM
 * 8:30 PM
 */
const SHOW_TIMINGS = [
  {
    startHour: 10,
    startMinute: 0,
    endHour: 12,
    endMinute: 30,
  },
  {
    startHour: 13,
    startMinute: 30,
    endHour: 16,
    endMinute: 0,
  },
  {
    startHour: 17,
    startMinute: 0,
    endHour: 19,
    endMinute: 30,
  },
  {
    startHour: 20,
    startMinute: 30,
    endHour: 23,
    endMinute: 0,
  },
];

const DAYS_TO_SEED = 3;

/**
 * Create a Date representing an IST date/time.
 *
 * Example:
 *
 * createISTDate(0, 10, 0)
 *
 * = today at 10:00 AM IST
 */
function createISTDate(dayOffset: number, hour: number, minute: number): Date {
  const now = new Date();

  /**
   * Get today's date in India.
   */
  const istDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(istDate.find((part) => part.type === 'year')?.value);

  const month = Number(istDate.find((part) => part.type === 'month')?.value);

  const day = Number(istDate.find((part) => part.type === 'day')?.value);

  /**
   * Start from midnight in IST.
   *
   * Date.UTC is used here and then we subtract the IST
   * offset so the resulting Date represents the correct
   * instant.
   */
  const utcMidnight = new Date(Date.UTC(year, month - 1, day + dayOffset));

  /**
   * IST = UTC + 05:30.
   *
   * To create an instant corresponding to local IST time,
   * subtract 5:30 from the UTC representation.
   */
  return new Date(
    utcMidnight.getTime() -
      5.5 * 60 * 60 * 1000 +
      hour * 60 * 60 * 1000 +
      minute * 60 * 1000,
  );
}

async function main() {
  console.log('');
  console.log('🎬 Starting show seed...');
  console.log(`Movie ID: ${MOVIE_ID}`);
  console.log('');

  /**
   * ---------------------------------------------------------
   * 1. Verify movie
   * ---------------------------------------------------------
   */
  const movie = await prisma.movie.findUnique({
    where: {
      id: MOVIE_ID,
    },
  });

  if (!movie) {
    throw new Error(`Movie not found: ${MOVIE_ID}`);
  }

  console.log(`🎥 Movie: ${movie.title}`);
  console.log('');

  /**
   * ---------------------------------------------------------
   * 2. Get all screens
   * ---------------------------------------------------------
   *
   * Every screen belongs to a theatre.
   *
   * We create the movie shows on every available screen.
   */
  const screens = await prisma.screen.findMany({
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
    },
    orderBy: [
      {
        theatreId: 'asc',
      },
      {
        name: 'asc',
      },
    ],
  });

  if (screens.length === 0) {
    throw new Error('No screens found. Create theatres and screens first.');
  }

  console.log(`🏢 Screens found: ${screens.length}`);
  console.log('');

  let createdShows = 0;
  let existingShows = 0;
  let createdShowSeats = 0;

  /**
   * ---------------------------------------------------------
   * 3. Create shows for today + next 2 days
   * ---------------------------------------------------------
   */
  for (let dayOffset = 0; dayOffset < DAYS_TO_SEED; dayOffset++) {
    for (const screen of screens) {
      for (const timing of SHOW_TIMINGS) {
        const startTime = createISTDate(
          dayOffset,
          timing.startHour,
          timing.startMinute,
        );

        const endTime = createISTDate(
          dayOffset,
          timing.endHour,
          timing.endMinute,
        );

        /**
         * Don't create a show if this exact show already exists.
         */
        const existingShow = await prisma.show.findUnique({
          where: {
            screenId_startTime: {
              screenId: screen.id,
              startTime,
            },
          },
        });

        let show;

        if (existingShow) {
          show = existingShow;
          existingShows++;

          console.log(
            `↪️  Already exists | ${screen.theatre.name} | ${screen.name} | ${startTime.toISOString()}`,
          );
        } else {
          /**
           * Create the show.
           */
          show = await prisma.show.create({
            data: {
              movieId: MOVIE_ID,
              screenId: screen.id,

              startTime,
              endTime,

              format: '2D',

              cancellationAllowed: screen.theatre.cancellationAllowed,
            },
          });

          createdShows++;

          console.log(
            `✅ Show created | ${screen.theatre.name} | ${screen.name} | ${startTime.toISOString()}`,
          );
        }

        /**
         * -----------------------------------------------------
         * Create ShowSeat records
         * -----------------------------------------------------
         *
         * Every physical Seat on the screen gets a
         * show-specific ShowSeat.
         *
         * The price comes from the base Seat price.
         */
        if (screen.seats.length > 0) {
          const showSeats = await prisma.showSeat.createMany({
            data: screen.seats.map((seat) => ({
              showId: show.id,
              seatId: seat.id,
              status: seat.status,
              price: seat.price,
            })),
            skipDuplicates: true,
          });

          createdShowSeats += showSeats.count;
        }
      }
    }
  }

  /**
   * ---------------------------------------------------------
   * Summary
   * ---------------------------------------------------------
   */
  console.log('');
  console.log('========================================');
  console.log('🎬 SHOW SEED COMPLETED');
  console.log('========================================');
  console.log(`Movie:              ${movie.title}`);
  console.log(`Movie ID:           ${MOVIE_ID}`);
  console.log(`Screens:            ${screens.length}`);
  console.log(`Days:               ${DAYS_TO_SEED}`);
  console.log(`Shows per screen:   ${SHOW_TIMINGS.length}`);
  console.log(`Shows created:      ${createdShows}`);
  console.log(`Shows already exist: ${existingShows}`);
  console.log(`ShowSeats created:  ${createdShowSeats}`);
  console.log('========================================');
  console.log('');
}

main()
  .catch((error) => {
    console.error('');
    console.error('❌ Seed failed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
