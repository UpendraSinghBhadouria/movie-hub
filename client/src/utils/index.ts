export * from "./bookingSuccess";

export const createSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const getMoviePoster = (slug: string) => {
  return `/assets/movies/${slug}.jfif`;
};