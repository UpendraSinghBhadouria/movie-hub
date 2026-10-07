import { PrismaPg } from '@prisma/adapter-pg';
import { MovieStatus, PrismaClient } from '../src/generated/prisma/client.js';

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

// const movies = [
//   {
//     title: 'Dhurandhar: The Revenge',
//     description:
//       'An action thriller and sequel continuing the high-stakes espionage story.',
//     certificate: 'UA',
//     posterUrl: 'dhurandhar-the-revenge',
//     bannerUrl: 'dhurandhar-the-revenge-banner',
//     rating: 8.5,
//     votes: 18420,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 158,
//     releaseDate: new Date('2026-03-19'),
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Action', 'Thriller', 'Drama'],
//   },
//   {
//     title: 'Border 2',
//     description:
//       'A military action drama inspired by the lives and sacrifices of soldiers.',
//     certificate: 'UA',
//     posterUrl: 'border-2',
//     bannerUrl: 'border-2-banner',
//     rating: 8.1,
//     votes: 22150,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 145,
//     releaseDate: new Date('2026-01-23'),
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Action', 'Drama', 'War'],
//   },
//   {
//     title: 'Bhooth Bangla',
//     description:
//       'A horror comedy built around a mysterious haunted house and an unusual group of visitors.',
//     certificate: 'UA',
//     posterUrl: 'bhooth-bangla',
//     bannerUrl: 'bhooth-bangla-banner',
//     rating: 7.2,
//     votes: 8700,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 132,
//     releaseDate: new Date('2026-04-17'),
//     languages: ['Hindi'],
//     genres: ['Horror', 'Comedy'],
//   },
//   {
//     title: 'The RajaSaab',
//     description:
//       'A Telugu horror comedy mixing romance, supernatural mystery and large-scale entertainment.',
//     certificate: 'UA',
//     rating: 7.4,
//     votes: 15100,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 165,
//     releaseDate: new Date('2026-01-09'),
//     posterUrl: 'the-raja-saab',
//     bannerUrl: 'the-raja-saab-banner',
//     promoted: true,
//     languages: ['Telugu', 'Hindi', 'Tamil'],
//     genres: ['Horror', 'Comedy', 'Romance'],
//   },
//   {
//     title: 'Ustaad Bhagat Singh',
//     description:
//       'A Telugu action entertainer featuring an uncompromising police officer.',
//     certificate: 'UA',
//     rating: 7.5,
//     votes: 11400,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 149,
//     releaseDate: new Date('2026-04-09'),
//     posterUrl: 'ustaad-bhagat-singh',
//     bannerUrl: 'ustaad-bhagat-singh-banner',
//     promoted: true,
//     languages: ['Telugu', 'Hindi'],
//     genres: ['Action', 'Drama'],
//   },
//   {
//     title: 'Jailer 2',
//     description:
//       'A Tamil action entertainer continuing the story of a retired jailer drawn back into danger.',
//     certificate: 'UA',
//     rating: 8.2,
//     votes: 19800,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 155,
//     releaseDate: new Date('2026-08-12'),
//     posterUrl: 'jailer-2',
//     bannerUrl: 'jailer-2-banner',
//     promoted: true,
//     languages: ['Tamil', 'Hindi', 'Telugu'],
//     genres: ['Action', 'Thriller', 'Drama'],
//   },
//   {
//     title: 'Awarapan 2',
//     description:
//       'A Hindi romantic action drama following a troubled protagonist seeking redemption.',
//     certificate: 'UA',
//     rating: 7.6,
//     votes: 7200,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 139,
//     releaseDate: new Date('2026-08-14'),
//     posterUrl: 'awarapan-2',
//     bannerUrl: 'awarapan-2-banner',
//     languages: ['Hindi'],
//     genres: ['Action', 'Romance', 'Drama'],
//   },
//   {
//     title: 'Mirzapur: The Movie',
//     description:
//       'A Hindi crime action film expanding the world of Mirzapur and its rivalries.',
//     certificate: 'A',
//     rating: 8.0,
//     votes: 17400,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 142,
//     releaseDate: new Date('2026-09-04'),
//     posterUrl: 'mirzapur-the-movie',
//     bannerUrl: 'mirzapur-the-movie-banner',
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Crime', 'Action', 'Thriller'],
//   },
//   {
//     title: 'Drishyam 3: The Conclusion',
//     description:
//       'A Hindi crime thriller continuing the Salgaonkar family story with a new investigation.',
//     certificate: 'UA',
//     rating: 8.4,
//     votes: 13500,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 148,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'drishyam-3-the-conclusion',
//     bannerUrl: 'drishyam-3-the-conclusion-banner',
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Crime', 'Thriller', 'Drama'],
//   },
//   {
//     title: 'Prem Keetanu',
//     description:
//       'A Hindi romantic comedy about young love, misunderstandings and unexpected complications.',
//     certificate: 'UA',
//     rating: 6.9,
//     votes: 2300,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 119,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'prem-keetanu',
//     bannerUrl: 'prem-keetanu-banner',
//     languages: ['Hindi'],
//     genres: ['Romance', 'Comedy'],
//   },
//   {
//     title: 'The Vvaan - Force of the Forrest',
//     description:
//       'A Hindi action adventure set against a mysterious forest and its hidden forces.',
//     certificate: 'UA',
//     rating: 7.1,
//     votes: 4200,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 138,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'the-vvaan-force-of-the-forrest',
//     bannerUrl: 'the-vvaan-force-of-the-forrest-banner',
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Action', 'Adventure', 'Fantasy'],
//   },
//   {
//     title: "Don't Be Shy",
//     description:
//       'A Hindi comedy drama about friendship, confidence and finding a new direction in life.',
//     certificate: 'U',
//     rating: 6.8,
//     votes: 1800,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 121,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'dont-be-shy',
//     bannerUrl: 'dont-be-shy-banner',
//     languages: ['Hindi'],
//     genres: ['Comedy', 'Drama'],
//   },
//   {
//     title: 'Pooja Meri Jaan',
//     description:
//       'A Hindi drama exploring friendship, identity and difficult personal circumstances.',
//     certificate: 'UA',
//     rating: 7.1,
//     votes: 1700,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 124,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'pooja-meri-jaan',
//     bannerUrl: 'pooja-meri-jaan-banner',
//     languages: ['Hindi'],
//     genres: ['Drama', 'Thriller'],
//   },
//   {
//     title: 'Vayuputra',
//     description:
//       'A Telugu mythological action adventure inspired by the legendary figure of Hanuman.',
//     certificate: 'UA',
//     rating: 8.1,
//     votes: 8400,
//     status: MovieStatus.UPCOMING,
//     durationMin: 160,
//     releaseDate: new Date('2026-10-16'),
//     posterUrl: 'vayuputra',
//     bannerUrl: 'vayuputra-banner',
//     promoted: true,
//     languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada'],
//     genres: ['Action', 'Fantasy', 'Mythology'],
//   },
//   {
//     title: 'Ramayana',
//     description:
//       'A large-scale Indian mythological epic bringing the Ramayana to the big screen.',
//     certificate: 'UA',
//     rating: 8.7,
//     votes: 25000,
//     status: MovieStatus.UPCOMING,
//     durationMin: 180,
//     releaseDate: new Date('2026-11-08'),
//     posterUrl: 'ramayana',
//     bannerUrl: 'ramayana-banner',
//     promoted: true,
//     languages: ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'],
//     genres: ['Epic', 'Fantasy', 'Drama'],
//   },
//   {
//     title: 'The Hunger Games: Sunrise on the Reaping',
//     description:
//       'A dystopian science-fiction prequel set in the world of Panem.',
//     certificate: 'UA',
//     rating: 8.0,
//     votes: 9800,
//     status: MovieStatus.UPCOMING,
//     durationMin: 145,
//     releaseDate: new Date('2026-11-20'),
//     posterUrl: 'the-hunger-games-sunrise-on-the-reaping',
//     bannerUrl: 'the-hunger-games-sunrise-on-the-reaping-banner',
//     promoted: true,
//     languages: ['English', 'Hindi'],
//     genres: ['Action', 'Science Fiction', 'Drama'],
//   },
//   {
//     title: 'King',
//     description:
//       'A Hindi action thriller following a powerful character drawn into a dangerous mission.',
//     certificate: 'UA',
//     rating: 8.2,
//     votes: 14300,
//     status: MovieStatus.UPCOMING,
//     durationMin: 150,
//     releaseDate: new Date('2026-12-24'),
//     posterUrl: 'king',
//     bannerUrl: 'king-banner',
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Action', 'Thriller', 'Drama'],
//   },
//   {
//     title: 'Shakti Shalini',
//     description:
//       'A Hindi fantasy adventure built around a mysterious heroine and supernatural forces.',
//     certificate: 'UA',
//     rating: 7.3,
//     votes: 4200,
//     status: MovieStatus.UPCOMING,
//     durationMin: 135,
//     releaseDate: new Date('2026-12-24'),
//     posterUrl: 'shakti-shalini',
//     bannerUrl: 'shakti-shalini-banner',
//     promoted: true,
//     languages: ['Hindi'],
//     genres: ['Fantasy', 'Adventure', 'Action'],
//   },
//   {
//     title: 'Rowdy Janardhana',
//     description:
//       'A Telugu action entertainer centered on a larger-than-life local hero.',
//     certificate: 'UA',
//     rating: 7.2,
//     votes: 3100,
//     status: MovieStatus.UPCOMING,
//     durationMin: 140,
//     releaseDate: new Date('2026-12-25'),
//     posterUrl: 'rowdy-janardhana',
//     bannerUrl: 'rowdy-janardhana-banner',
//     promoted: true,
//     languages: ['Telugu', 'Hindi'],
//     genres: ['Action', 'Comedy', 'Drama'],
//   },
//   {
//     title: 'Mysaa',
//     description:
//       'A multilingual action drama featuring a woman caught between family and dangerous forces.',
//     certificate: 'UA',
//     rating: 7.5,
//     votes: 2800,
//     status: MovieStatus.UPCOMING,
//     durationMin: 137,
//     releaseDate: new Date('2026-11-20'),
//     posterUrl: 'mysaa',
//     bannerUrl: 'mysaa-banner',
//     promoted: true,
//     languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
//     genres: ['Action', 'Drama', 'Thriller'],
//   },
//   {
//     title: 'Vrushakarma',
//     description:
//       'A multilingual drama combining action, family relationships and personal ambition.',
//     certificate: 'UA',
//     rating: 7.4,
//     votes: 2400,
//     status: MovieStatus.UPCOMING,
//     durationMin: 142,
//     releaseDate: new Date('2026-11-27'),
//     posterUrl: 'vrushakarma',
//     bannerUrl: 'vrushakarma-banner',
//     promoted: true,
//     languages: ['Telugu', 'Tamil', 'Kannada', 'Hindi', 'Malayalam'],
//     genres: ['Drama', 'Action'],
//   },
//   {
//     title: 'Mana Shankara Vara Prasad Garu',
//     description:
//       'A Telugu action entertainer blending family drama, comedy and commercial cinema.',
//     certificate: 'UA',
//     posterUrl: 'mana-shankara-vara-prasad-garu',
//     bannerUrl: 'mana-shankara-vara-prasad-garu-banner',
//     rating: 7.8,
//     votes: 12300,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 151,
//     releaseDate: new Date('2026-01-12'),
//     promoted: true,
//     languages: ['Telugu'],
//     genres: ['Action', 'Comedy', 'Drama'],
//   },
//   {
//     title: 'Vaazha II: Biopic of a Billion Bros',
//     description:
//       'A Malayalam comedy drama following friendship, family expectations and adulthood.',
//     certificate: 'U',
//     rating: 8.0,
//     votes: 7600,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 128,
//     releaseDate: new Date('2026-04-03'),
//     posterUrl: 'vaazha-ii',
//     bannerUrl: 'vaazha-ii-banner',
//     languages: ['Malayalam'],
//     genres: ['Comedy', 'Drama', 'Family'],
//   },
//   {
//     title: 'Aadu 3',
//     description:
//       'A Malayalam comedy adventure continuing the popular Aadu franchise.',
//     certificate: 'U',
//     rating: 7.7,
//     votes: 6100,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 140,
//     releaseDate: new Date('2026-03-20'),
//     posterUrl: 'aadu-3',
//     bannerUrl: 'aadu-3-banner',
//     languages: ['Malayalam'],
//     genres: ['Comedy', 'Adventure'],
//   },
//   {
//     title: 'Anaganaga Oka Raju',
//     description:
//       'A Telugu comedy drama about an ordinary man caught in an extraordinary situation.',
//     certificate: 'U',
//     rating: 7.9,
//     votes: 9300,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 136,
//     releaseDate: new Date('2026-01-14'),
//     posterUrl: 'anaganaga-oka-raju',
//     bannerUrl: 'anaganaga-oka-raju-banner',
//     languages: ['Telugu'],
//     genres: ['Comedy', 'Drama', 'Romance'],
//   },
//   {
//     title: 'Parasakthi',
//     description:
//       'A Tamil period action drama centered around family, politics and social change.',
//     certificate: 'UA',
//     rating: 7.6,
//     votes: 8900,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 154,
//     releaseDate: new Date('2026-01-10'),
//     posterUrl: 'parasakthi',
//     bannerUrl: 'parasakthi-banner',
//     promoted: true,
//     languages: ['Tamil'],
//     genres: ['Action', 'Drama', 'Historical'],
//   },
//   {
//     title: 'Aaram',
//     description:
//       'A Malayalam drama exploring relationships, family and personal choices.',
//     certificate: 'U',
//     rating: 7.0,
//     votes: 2100,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 122,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'aaram',
//     bannerUrl: 'aaram-banner',
//     languages: ['Malayalam'],
//     genres: ['Drama', 'Family'],
//   },
//   {
//     title: 'Amanushikam',
//     description:
//       'A Malayalam supernatural thriller involving unexplained events and a troubled family.',
//     certificate: 'UA',
//     rating: 7.3,
//     votes: 2500,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 126,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'amanushikam',
//     bannerUrl: 'amanushikam-banner',
//     languages: ['Malayalam'],
//     genres: ['Horror', 'Mystery', 'Thriller'],
//   },
//   {
//     title: 'Heggana Muddu',
//     description:
//       'A Kannada romantic drama built around relationships, ambition and family.',
//     certificate: 'U',
//     rating: 6.9,
//     votes: 1500,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 124,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'heggana-muddu',
//     bannerUrl: 'heggana-muddu-banner',
//     languages: ['Kannada'],
//     genres: ['Romance', 'Drama'],
//   },
//   {
//     title: 'Baththa',
//     description:
//       'A Tamil drama featuring a grounded story of people facing difficult personal choices.',
//     certificate: 'UA',
//     rating: 7.1,
//     votes: 1700,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 129,
//     releaseDate: new Date('2026-10-01'),
//     posterUrl: 'baththa',
//     bannerUrl: 'baththa-banner',
//     languages: ['Tamil'],
//     genres: ['Drama', 'Thriller'],
//   },
//   {
//     title: 'Yezhu Kadal Yezhu Malai',
//     description:
//       'A Tamil romantic drama involving an unusual journey and an unexpected relationship.',
//     certificate: 'UA',
//     rating: 7.4,
//     votes: 3200,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 137,
//     releaseDate: new Date('2026-10-01'),
//     posterUrl: 'yezhu-kadal-yezhu-malai',
//     bannerUrl: 'yezhu-kadal-yezhu-malai-banner',
//     languages: ['Tamil'],
//     genres: ['Drama', 'Romance'],
//   },
//   {
//     title: 'Heart of the Beast',
//     description:
//       'An international survival thriller following a dangerous mission in the wilderness.',
//     certificate: 'UA',
//     rating: 7.5,
//     votes: 6800,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 126,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'heart-of-the-beast',
//     bannerUrl: 'heart-of-the-beast-banner',
//     languages: ['English'],
//     genres: ['Action', 'Thriller', 'Adventure'],
//   },
//   {
//     title: 'Runner',
//     description:
//       'An action comedy about an unexpected partnership and a race against time.',
//     certificate: 'UA',
//     rating: 7.0,
//     votes: 3900,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 118,
//     releaseDate: new Date('2026-09-25'),
//     posterUrl: 'runner',
//     bannerUrl: 'runner-banner',
//     languages: ['English'],
//     genres: ['Action', 'Comedy'],
//   },
//   {
//     title: 'Anbil Avan',
//     description:
//       'A Tamil romantic drama following two people whose lives intersect unexpectedly.',
//     certificate: 'UA',
//     rating: 7.0,
//     votes: 2100,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 125,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'anbil-avan',
//     bannerUrl: 'anbil-avan-banner',
//     languages: ['Tamil'],
//     genres: ['Romance', 'Drama'],
//   },
//   {
//     title: 'SI Yugandhar',
//     description:
//       'A Telugu police action thriller about an officer investigating a dangerous criminal network.',
//     certificate: 'UA',
//     rating: 7.2,
//     votes: 2700,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 132,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'si-yugandhar',
//     bannerUrl: 'si-yugandhar-banner',
//     languages: ['Telugu'],
//     genres: ['Action', 'Crime', 'Thriller'],
//   },
//   {
//     title: 'The Third Murder',
//     description:
//       'A Malayalam crime mystery centered on a complex murder investigation.',
//     certificate: 'UA',
//     rating: 7.4,
//     votes: 1900,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 128,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'the-third-murder',
//     bannerUrl: 'the-third-murder-banner',
//     languages: ['Malayalam'],
//     genres: ['Crime', 'Mystery', 'Thriller'],
//   },
//   {
//     title: 'Halka Don',
//     description:
//       'A Kannada comedy drama about an ordinary person who unexpectedly enters the world of crime.',
//     certificate: 'UA',
//     rating: 6.8,
//     votes: 1200,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 118,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'halka_don',
//     bannerUrl: 'halka_don-banner',
//     languages: ['Kannada'],
//     genres: ['Comedy', 'Crime', 'Drama'],
//   },
//   {
//     title: 'Orijinal',
//     description:
//       'A Malayalam action drama focused on identity, family and difficult choices.',
//     certificate: 'UA',
//     rating: 7.0,
//     votes: 1400,
//     status: MovieStatus.NOW_SHOWING,
//     durationMin: 131,
//     releaseDate: new Date('2026-10-02'),
//     posterUrl: 'orijinal',
//     bannerUrl: 'orijinal-banner',
//     languages: ['Malayalam'],
//     genres: ['Action', 'Drama', 'Thriller'],
//   },
//   {
//     title: 'Samavarthi',
//     description:
//       'A multilingual action thriller involving family secrets and a dangerous conflict.',
//     certificate: 'UA',
//     rating: 7.3,
//     votes: 2200,
//     status: MovieStatus.UPCOMING,
//     durationMin: 136,
//     releaseDate: new Date('2026-12-24'),
//     posterUrl: 'samavarthi',
//     bannerUrl: 'samavarthi-banner',
//     promoted: true,
//     languages: ['Telugu', 'Tamil', 'Kannada', 'Malayalam'],
//     genres: ['Action', 'Thriller', 'Drama'],
//   },
//   {
//     title: 'Secret Soldier',
//     description:
//       'A Telugu action thriller about a soldier operating behind enemy lines.',
//     certificate: 'UA',
//     rating: 7.0,
//     votes: 1600,
//     status: MovieStatus.UPCOMING,
//     durationMin: 130,
//     releaseDate: new Date('2026-12-24'),
//     posterUrl: 'secret-soldier',
//     bannerUrl: 'secret-soldier-banner',
//     promoted: true,
//     languages: ['Telugu'],
//     genres: ['Action', 'Thriller'],
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
//   // await prisma.movieLanguage.deleteMany();
//   // await prisma.movieGenre.deleteMany();
//   // await prisma.movie.deleteMany();

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
//     const existingMovie = await prisma.movie.findFirst({
//       where: {
//         title: movie.title,
//       },
//     });

//     if (existingMovie) {
//       await prisma.movie.update({
//         where: {
//           id: existingMovie.id,
//         },
//         data: {
//           description: movie.description,
//           posterUrl: movie.posterUrl,
//           bannerUrl: movie.bannerUrl,
//           certificate: movie.certificate,
//           rating: movie.rating,
//           votes: movie.votes,
//           status: movie.status,
//           durationMin: movie.durationMin,
//           releaseDate: movie.releaseDate,
//           promoted: movie.promoted,

//           languages: {
//             deleteMany: {},
//             create: movie.languages.map((name) => ({
//               languageId: languages.get(name)!,
//             })),
//           },

//           genres: {
//             deleteMany: {},
//             create: movie.genres.map((name) => ({
//               genreId: genres.get(name)!,
//             })),
//           },
//         },
//       });
//     } else {
//       await prisma.movie.create({
//         data: {
//           title: movie.title,
//           description: movie.description,
//           posterUrl: movie.posterUrl,
//           bannerUrl: movie.bannerUrl,
//           certificate: movie.certificate,
//           rating: movie.rating,
//           votes: movie.votes,
//           status: movie.status,
//           durationMin: movie.durationMin,
//           releaseDate: movie.releaseDate,
//           promoted: movie.promoted,

//           languages: {
//             create: movie.languages.map((name) => ({
//               languageId: languages.get(name)!,
//             })),
//           },

//           genres: {
//             create: movie.genres.map((name) => ({
//               genreId: genres.get(name)!,
//             })),
//           },
//         },
//       });
//     }

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
  console.log('');

  /**
   * ---------------------------------------------------------
   * 1. Verify movie
   * ---------------------------------------------------------
   */
  const movies = await prisma.movie.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (movies.length === 0) {
    throw new Error('No movies found. Create movies first.');
  }

  console.log(`🎬 Movies found: ${movies.length}`);
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
    for (let screenIndex = 0; screenIndex < screens.length; screenIndex++) {
      const screen = screens[screenIndex];

      for (
        let timingIndex = 0;
        timingIndex < SHOW_TIMINGS.length;
        timingIndex++
      ) {
        const timing = SHOW_TIMINGS[timingIndex];

        /**
         * Rotate movies between show slots.
         */
        const movieIndex =
          dayOffset * screens.length * SHOW_TIMINGS.length +
          screenIndex * SHOW_TIMINGS.length +
          timingIndex;

        const movie = movies[movieIndex % movies.length];

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
            `↪️ Already exists | ${existingShow.movieId} | ${screen.theatre.name} | ${screen.name} | ${startTime.toISOString()}`,
          );
        } else {
          show = await prisma.show.create({
            data: {
              movieId: movie.id,
              screenId: screen.id,
              startTime,
              endTime,
              format: '2D',
              cancellationAllowed: screen.theatre.cancellationAllowed,
            },
          });

          createdShows++;

          console.log(
            `✅ Show created | ${movie.title} | ${screen.theatre.name} | ${screen.name} | ${startTime.toISOString()}`,
          );
        }

        /**
         * Create ShowSeat records.
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


/**
 * ---------------------------------------------------------
 * Theatre configuration
 * ---------------------------------------------------------
 *
 * 10 theatres
 * 4 screens per theatre
 *
 * Total:
 *
 * 10 theatres
 * 40 screens
 * ~1,500+ seats
 */
// const THEATRES = [
//   {
//     name: 'INOX DB Mall',
//     brand: 'INOX',
//     address: 'DB City Mall, Maharana Pratap Nagar',
//     city: 'Bhopal',
//     state: 'Madhya Pradesh',
//   },
//   {
//     name: 'PVR Aura Mall',
//     brand: 'PVR INOX',
//     address: 'Aura Mall, Trilanga',
//     city: 'Bhopal',
//     state: 'Madhya Pradesh',
//   },
//   {
//     name: 'Cinepolis Bhopal',
//     brand: 'Cinepolis',
//     address: 'Aashima Mall, Hoshangabad Road',
//     city: 'Bhopal',
//     state: 'Madhya Pradesh',
//   },
//   {
//     name: 'PVR Phoenix Mall',
//     brand: 'PVR INOX',
//     address: 'Phoenix Mall, Vijay Nagar',
//     city: 'Indore',
//     state: 'Madhya Pradesh',
//   },
//   {
//     name: 'INOX C21 Mall',
//     brand: 'INOX',
//     address: 'C21 Mall, AB Road',
//     city: 'Indore',
//     state: 'Madhya Pradesh',
//   },
//   {
//     name: 'Cinepolis Indore',
//     brand: 'Cinepolis',
//     address: 'Malhar Mega Mall',
//     city: 'Indore',
//     state: 'Madhya Pradesh',
//   },
//   {
//     name: 'PVR DLF Mall',
//     brand: 'PVR INOX',
//     address: 'DLF Mall, Saket',
//     city: 'Delhi',
//     state: 'Delhi',
//   },
//   {
//     name: 'INOX Nehru Place',
//     brand: 'INOX',
//     address: 'Nehru Place',
//     city: 'Delhi',
//     state: 'Delhi',
//   },
//   {
//     name: 'Cinepolis Pacific Mall',
//     brand: 'Cinepolis',
//     address: 'Pacific Mall, Tagore Garden',
//     city: 'Delhi',
//     state: 'Delhi',
//   },
//   {
//     name: 'PVR Select City Walk',
//     brand: 'PVR INOX',
//     address: 'Select City Walk, Saket',
//     city: 'Delhi',
//     state: 'Delhi',
//   },
// ];

// /**
//  * ---------------------------------------------------------
//  * Screen configuration
//  * ---------------------------------------------------------
//  *
//  * Every theatre gets these screens.
//  */
// const SCREEN_CONFIG = [
//   {
//     name: 'Screen 1',
//     rows: 10,
//     seatsPerRow: 12,
//   },
//   {
//     name: 'Screen 2',
//     rows: 12,
//     seatsPerRow: 14,
//   },
//   {
//     name: 'Screen 3',
//     rows: 14,
//     seatsPerRow: 16,
//   },
//   {
//     name: 'Screen 4',
//     rows: 16,
//     seatsPerRow: 18,
//   },
// ];

// /**
//  * ---------------------------------------------------------
//  * Seat pricing
//  * ---------------------------------------------------------
//  */
// const SEAT_PRICES = {
//   NORMAL: 220,
//   EXECUTIVE: 320,
//   PREMIUM: 420,
// };

// /**
//  * Decide seat category based on row position.
//  *
//  * First 60%  -> NORMAL
//  * Next 25%   -> EXECUTIVE
//  * Last 15%   -> PREMIUM
//  */
// function getSeatCategory(
//   rowIndex: number,
//   totalRows: number,
// ) {
//   const ratio = rowIndex / totalRows;

//   if (ratio < 0.6) {
//     return 'NORMAL' as const;
//   }

//   if (ratio < 0.85) {
//     return 'EXECUTIVE' as const;
//   }

//   return 'PREMIUM' as const;
// }

// /**
//  * Convert row number into alphabetic row.
//  *
//  * 0  -> A
//  * 1  -> B
//  * 25 -> Z
//  * 26 -> AA
//  */
// function getRowName(rowIndex: number): string {
//   let result = '';
//   let index = rowIndex;

//   while (index >= 0) {
//     result =
//       String.fromCharCode((index % 26) + 65) + result;

//     index = Math.floor(index / 26) - 1;
//   }

//   return result;
// }

// async function main() {
//   console.log('');
//   console.log('🏢 Starting theatre seed...');
//   console.log('');

//   let createdTheatres = 0;
//   let existingTheatres = 0;

//   let createdScreens = 0;
//   let existingScreens = 0;

//   let createdSeats = 0;

//   /**
//    * ---------------------------------------------------------
//    * 1. Create theatres
//    * ---------------------------------------------------------
//    */
//   for (const theatreData of THEATRES) {
//     /**
//      * Find theatre by:
//      *
//      * name + city
//      *
//      * because your schema has:
//      *
//      * @@unique([name, city])
//      */
//     let theatre = await prisma.theatre.findUnique({
//       where: {
//         name_city: {
//           name: theatreData.name,
//           city: theatreData.city,
//         },
//       },
//     });

//     if (theatre) {
//       existingTheatres++;

//       console.log(
//         `↪️ Theatre exists | ${theatre.name} | ${theatre.city}`,
//       );
//     } else {
//       theatre = await prisma.theatre.create({
//         data: {
//           name: theatreData.name,
//           brand: theatreData.brand,
//           address: theatreData.address,
//           city: theatreData.city,
//           state: theatreData.state,

//           cancellationAllowed: true,
//         },
//       });

//       createdTheatres++;

//       console.log(
//         `✅ Theatre created | ${theatre.name} | ${theatre.city}`,
//       );
//     }

//     /**
//      * -------------------------------------------------------
//      * 2. Create screens
//      * -------------------------------------------------------
//      */
//     for (
//       let screenIndex = 0;
//       screenIndex < SCREEN_CONFIG.length;
//       screenIndex++
//     ) {
//       const config = SCREEN_CONFIG[screenIndex];

//       let screen = await prisma.screen.findUnique({
//         where: {
//           theatreId_name: {
//             theatreId: theatre.id,
//             name: config.name,
//           },
//         },
//       });

//       if (screen) {
//         existingScreens++;

//         console.log(
//           `   ↪️ Screen exists | ${theatre.name} | ${screen.name}`,
//         );
//       } else {
//         screen = await prisma.screen.create({
//           data: {
//             name: config.name,
//             theatreId: theatre.id,
//           },
//         });

//         createdScreens++;

//         console.log(
//           `   🎥 Screen created | ${theatre.name} | ${screen.name}`,
//         );
//       }

//       /**
//        * -----------------------------------------------------
//        * 3. Create seats
//        * -----------------------------------------------------
//        */
//       const seatsToCreate = [];

//       for (
//         let rowIndex = 0;
//         rowIndex < config.rows;
//         rowIndex++
//       ) {
//         const row = getRowName(rowIndex);

//         const category = getSeatCategory(
//           rowIndex,
//           config.rows,
//         );

//         const price = SEAT_PRICES[category];

//         for (
//           let seatNumber = 1;
//           seatNumber <= config.seatsPerRow;
//           seatNumber++
//         ) {
//           seatsToCreate.push({
//             screenId: screen.id,
//             row,
//             number: seatNumber,
//             category,
//             price,
//             status: 'AVAILABLE' as const,
//           });
//         }
//       }

//       const result = await prisma.seat.createMany({
//         data: seatsToCreate,
//         skipDuplicates: true,
//       });

//       createdSeats += result.count;

//       console.log(
//         `      💺 Seats added: ${result.count}`,
//       );
//     }
//   }

//   /**
//    * ---------------------------------------------------------
//    * Summary
//    * ---------------------------------------------------------
//    */
//   const theatreCount = await prisma.theatre.count();
//   const screenCount = await prisma.screen.count();
//   const seatCount = await prisma.seat.count();

//   console.log('');
//   console.log('========================================');
//   console.log('🏢 THEATRE SEED COMPLETED');
//   console.log('========================================');

//   console.log(`Theatres created:       ${createdTheatres}`);
//   console.log(`Theatres already exist: ${existingTheatres}`);

//   console.log(`Screens created:        ${createdScreens}`);
//   console.log(`Screens already exist:  ${existingScreens}`);

//   console.log(`Seats created:           ${createdSeats}`);

//   console.log('');
//   console.log('📊 DATABASE TOTALS');
//   console.log(`Theatres:               ${theatreCount}`);
//   console.log(`Screens:                ${screenCount}`);
//   console.log(`Seats:                  ${seatCount}`);

//   console.log('');
//   console.log('🎬 Expected show capacity:');

//   console.log(
//     `${screenCount} screens × 3 days × 4 timings = ${
//       screenCount * 3 * 4
//     } shows`,
//   );

//   console.log('========================================');
//   console.log('');
// }

// main()
//   .catch((error) => {
//     console.error('');
//     console.error('❌ Theatre seed failed');
//     console.error(error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
