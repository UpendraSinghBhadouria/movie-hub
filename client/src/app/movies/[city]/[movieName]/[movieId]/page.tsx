import { TheatreTimings } from "@/components/TheatreTimings";
import { theatres } from "@/constants";
import { getErrorMessage } from "@/lib/getErrorMessage";
import serverApi from "@/lib/serverApi";
import { Movie } from "@/types";
import { getMoviePoster } from "@/utils";
import { Share2, Star } from "lucide-react";
import Image from "next/image";

type MoviePageProps = {
  params: Promise<{
    city: string;
    movieName: string;
    movieId: string;
  }>;
};

const getSingleMovie = async (movieId: string) => {
  try {
    const { data } = await serverApi.get<Movie>(`/movies/${movieId}`);
    return data;
  } catch (error) {
    const errorMsg = getErrorMessage(error);
    console.error("@@@@ MOVIE ERROR", errorMsg);
    return null;
  }
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;

  return `${hours}h ${mins}m`;
};

const formatDate = (date: string): string => {
  const [year, month, day] = date.split("T")[0].split("-");

  return `${day}-${month}-${year}`;
};

export default async function MoviePage({ params }: MoviePageProps) {
  const { city, movieName, movieId } = await params;

  const movie = await getSingleMovie(movieId);

  if (!movie) {
    return <p>No Movie found</p>;
  }
  // Temporary values until we add these fields to movie data.
  const format = "2D";
  const duration = formatDuration(movie.durationMin);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={getMoviePoster(movie.posterUrl)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Blur */}
          <div className="absolute inset-0 backdrop-blur-2xl" />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/65" />

          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent" />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            {/* Movie Poster */}
            <div className="mx-auto w-48 shrink-0 sm:w-56 md:mx-0 md:w-64 lg:w-72">
              <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/20 shadow-2xl">
                <Image
                  src={getMoviePoster(movie.posterUrl)}
                  alt={movie.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 256px, 288px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Movie Details */}
            <div className="min-w-0 flex-1 text-white">
              {/* Title + Share */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    {movie.title}
                  </h1>
                </div>

                <button
                  type="button"
                  aria-label="Share movie"
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/20
                    bg-white/10
                    backdrop-blur-sm
                    transition-colors
                    hover:bg-white/20
                  "
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Rating + Rate Now */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-primary text-primary" />

                  <span className="text-lg font-semibold">{movie.rating}</span>

                  <span className="text-sm text-white/70">
                    ({movie.votes} votes)
                  </span>
                </div>

                <button
                  type="button"
                  className="
                    rounded-md
                    border
                    border-white/25
                    bg-white/10
                    px-3
                    py-1.5
                    text-sm
                    font-medium
                    text-white
                    backdrop-blur-sm
                    transition-colors
                    hover:bg-white/20
    "
                >
                  Rate Now
                </button>
              </div>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
                <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1">
                  {formatDate(movie.releaseDate)}
                </span>

                <span>•</span>

                <span>{format}</span>

                <span>•</span>

                <span>{duration}</span>
              </div>

              {/* Genre */}
              <div className="mt-4">
                <p className="text-sm font-medium text-white/60">Genre</p>

                <p className="mt-1 text-sm sm:text-base">
                  {movie.genres.join(" • ")}
                </p>
              </div>

              {/* Languages */}
              <div className="mt-4">
                <p className="text-sm font-medium text-white/60">Languages</p>

                <p className="mt-1 text-sm sm:text-base">
                  {movie.languages.join(" ")}
                </p>
              </div>

              {/* About */}
              <div className="mt-6 max-w-2xl">
                <h2 className="text-lg font-semibold">About the movie</h2>

                <p className="mt-2 text-sm leading-6 text-white/75 sm:text-base">
                  {movie.description}
                </p>
              </div>

              {/* Book button - placeholder for next step */}
              <div className="mt-7">
                <button
                  type="button"
                  className="
                    rounded-lg
                    bg-primary
                    px-6
                    py-3
                    text-sm
                    font-semibold
                    text-primary-foreground
                    transition-opacity
                    hover:opacity-90
                  "
                >
                  Book Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TheatreTimings movieId={movieId} city={city} movieName={movieName} />
    </div>
  );
}
