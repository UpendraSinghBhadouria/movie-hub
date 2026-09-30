"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { languages } from "@/constants";
import { MovieCard } from "@/components/MovieCard";
import { MovieFilters } from "@/components/MovieFilters";
import { Button } from "@/components/ui/button";
import { Movie } from "@/types";

type MoviesClientProps = {
  movies: Movie[];
};

export default function MoviesClient({ movies }: MoviesClientProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    "Hindi",
  );

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesLanguage =
        !selectedLanguage || movie.languages.includes(selectedLanguage);

      const matchesGenre =
        !selectedGenre || movie.genres.includes(selectedGenre);

      // Format filtering can be added when format
      // is available in the movie data.
      const matchesFormat = !selectedFormat;

      return matchesLanguage && matchesGenre && matchesFormat;
    });
  }, [movies, selectedLanguage, selectedGenre, selectedFormat]);

  return (
    <section className="bg-background">
      <div
        className="
          mx-auto
          flex
          max-w-7xl
          flex-col
          gap-8
          px-4
          py-8
          sm:px-6
          lg:flex-row
          lg:items-start
          lg:px-8
        "
      >
        {/* LEFT — 30% */}
        <MovieFilters
          selectedLanguage={selectedLanguage}
          selectedGenre={selectedGenre}
          selectedFormat={selectedFormat}
          onLanguageChange={setSelectedLanguage}
          onGenreChange={setSelectedGenre}
          onFormatChange={setSelectedFormat}
        />

        {/* RIGHT — 70% */}
        <main className="min-w-0 flex-1 lg:w-[70%]">
          <h1 className="mb-5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Movies in Bhopal
          </h1>

          {/* Languages */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
            {languages.map((language) => {
              const isSelected = selectedLanguage === language;

              return (
                <Button
                  key={language}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() =>
                    setSelectedLanguage(isSelected ? null : language)
                  }
                  className="shrink-0 rounded-full"
                >
                  {language}
                </Button>
              );
            })}
          </div>

          {/* Coming Soon */}
          <div
            className="
              mb-8
              flex
              flex-col
              gap-4
              rounded-xl
              border
              border-border
              bg-card
              p-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                Coming Soon
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Explore upcoming movies and discover what&apos;s coming next.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto p-5"
            >
              Explore Upcoming Movies
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Movies */}
          {filteredMovies.length > 0 ? (
            <div
              className="
                grid
                grid-cols-2
                gap-x-3
                gap-y-8
                sm:grid-cols-3
                sm:gap-x-4
                lg:grid-cols-4
              "
            >
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <h3 className="text-base font-semibold text-foreground">
                No movies found
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Try selecting a different language or filter.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
