import { BannerSlider } from "@/components/BannerSlide";
import { LiveEvents } from "@/components/LiveEvents";
import { RecommendedMovies } from "@/components/RecommendedMovies";
import { banners } from "@/constants";

export default function Home() {
  return (
    <main>
      <BannerSlider banners={banners} />
      <RecommendedMovies />
      <LiveEvents />
    </main>
  );
}
