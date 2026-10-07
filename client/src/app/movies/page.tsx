import MoviesClient from "@/components/MoviesClient";
import serverApi from "@/lib/serverApi";
import { Movie } from "@/types";
import React from "react";

const getMovies = async () => {
  const res = await serverApi.get<Movie[]>("movies");
  return res.data;
};

const Movies = async () => {
  const movies = await getMovies();

  if (!movies || movies.length === 0) {
    return <p>No movies found</p>;
  }

  return <MoviesClient movies={movies} />;
};

export default Movies;
