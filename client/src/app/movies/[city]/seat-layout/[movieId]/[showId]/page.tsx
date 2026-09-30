import SeatLayoutClient from "@/components/SeatLayoutClient";

type PageProps = {
  params: Promise<{
    city: string;
    movieId: string;
    showId: string;
  }>;
};

export default async function SeatLayoutPage({ params }: PageProps) {
  const { movieId, city, showId } = await params;

  return (
    <SeatLayoutClient
      movieId={movieId}
      city={decodeURIComponent(city)}
      showId={showId}
    />
  );
}
