"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { StaticImageData } from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

import { MovieCard } from "@/components/MovieCard";
import { Movie } from "@/types";

type MovieSectionProps = {
  title: string;
  movies: Movie[];
  seeAllHref?: string;
};

export function MovieSection({
  title,
  movies,
  seeAllHref = "#",
}: MovieSectionProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const updateButtons = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    updateButtons();

    api.on("select", updateButtons);
    api.on("reInit", updateButtons);

    return () => {
      api.off("select", updateButtons);
      api.off("reInit", updateButtons);
    };
  }, [api]);

  if (!movies.length) return null;

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>

          <Link
            href={seeAllHref}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            See All
          </Link>
        </div>

        {/* Movie carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: false,
              // Automatically scroll by the number of visible slides.
              // Desktop: 5
              // Tablet: 3-4
              // Mobile: 2
              slidesToScroll: "auto",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {movies.map((movie) => (
                <CarouselItem
                  key={movie.id}
                  className="
                    basis-1/2
                    pl-3
                    sm:basis-1/3
                    md:basis-1/4
                    lg:basis-1/5
                  "
                >
                  <MovieCard movie={movie} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Navigation overlay — poster height only */}
          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              grid
              grid-cols-2
              sm:grid-cols-3
              md:grid-cols-4
              lg:grid-cols-5
            "
          >
            {/* Previous */}
            <div className="relative aspect-2/3">
              {canScrollPrev && (
                <button
                  type="button"
                  aria-label="Previous movies"
                  onClick={() => api?.scrollPrev()}
                  className="
                    pointer-events-auto
                    absolute
                    left-0
                    top-1/2
                    z-10
                    flex
                    h-9
                    w-9
                    -translate-x-1/2
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-border
                    bg-background/95
                    text-foreground
                    shadow-md
                    backdrop-blur-sm
                    transition-all
                    hover:bg-muted
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    sm:h-10
                    sm:w-10
                  "
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>

            {/* Next */}
            <div
              className="
                relative
                aspect-2/3
                col-start-2
                sm:col-start-3
                md:col-start-4
                lg:col-start-5
              "
            >
              {canScrollNext && (
                <button
                  type="button"
                  aria-label="Next movies"
                  onClick={() => api?.scrollNext()}
                  className="
                    pointer-events-auto
                    absolute
                    right-0
                    top-1/2
                    z-10
                    flex
                    h-9
                    w-9
                    translate-x-1/2
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-border
                    bg-background/95
                    text-foreground
                    shadow-md
                    backdrop-blur-sm
                    transition-all
                    hover:bg-muted
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    sm:h-10
                    sm:w-10
                  "
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
