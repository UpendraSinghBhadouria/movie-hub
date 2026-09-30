"use client";

import { movies } from "@/constants";
import { MovieSection } from "@/components/MovieSection";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Movie } from "@/types";

export function RecommendedMovies() {
  const { data, isError } = useQuery({
    queryKey: ["recommendedMovies"],
    queryFn: async () => {
      const response = await api.get<Movie[]>("/movies");
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  if (isError) {
    return <p>Something went wrong</p>;
  }

  return (
    <MovieSection
      title="Recommended"
      movies={data ?? []}
      seeAllHref="/movies"
    />
  );
}
