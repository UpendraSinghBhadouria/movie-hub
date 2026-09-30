import Image, { StaticImageData } from "next/image";
import { Star } from "lucide-react";
import { Movie } from "@/types";
import { useRouter } from "next/navigation";
import { useLocation } from "@/hooks/useLocation";
import { createSlug } from "@/utils";

type MovieCardProps = {
  movie: Movie;
};

export function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();
  const { location } = useLocation();

  const handleNavigation = () => {
    const movieSlug = createSlug(movie.title);
    // router.push(`/movies/${movie.id}/${decodeTitle}/${location}/ticket`);
    router.push(
      `/movies/${location.toLocaleLowerCase()}/${movieSlug}/${movie.id}`,
    );
  };

  return (
    <article className="group min-w-0">
      {/* Poster */}
      <div
        className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-muted"
        onClick={handleNavigation}
      >
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {movie.promoted && (
          <span className="absolute bottom-0 left-0 rounded-tr-md bg-background/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
            Promoted
          </span>
        )}
      </div>

      {/* Movie information */}
      <div className="px-1.5 pt-3 sm:px-2">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
          {movie.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
          {movie.genres[0]}
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />

          <span className="font-semibold text-foreground">{movie.rating}</span>

          <span className="text-muted-foreground">({movie.votes})</span>
        </div>
      </div>
    </article>
  );
}
