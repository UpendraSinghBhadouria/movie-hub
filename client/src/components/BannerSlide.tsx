"use client";

import Image, { StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

type BannerSliderProps = {
  banners: StaticImageData[];
};

const AUTOPLAY_DELAY = 4000;

export function BannerSlider({ banners }: BannerSliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [isHovered, setIsHovered] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);

  useEffect(() => {
    if (!api || isHovered) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, AUTOPLAY_DELAY);

    return () => {
      clearInterval(interval);
    };
  }, [api, isHovered, resetTimer]);

  const handlePrevious = () => {
    api?.scrollPrev();
    setResetTimer((value) => value + 1);
  };

  const handleNext = () => {
    api?.scrollNext();
    setResetTimer((value) => value + 1);
  };

  return (
    <section className="w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="group relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Carousel
            setApi={setApi}
            opts={{
              loop: true,
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {banners.map((banner, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4">
                  <div className="relative aspect-16/5 w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                    <Image
                      src={banner}
                      alt={`MovieHub banner ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, 1200px"
                      className="object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Previous button */}
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Previous banner"
            className="
              absolute left-5 top-1/2 z-10
              flex h-10 w-10 -translate-y-1/2
              items-center justify-center
              rounded-full
              border border-border
              bg-background/90
              text-foreground
              shadow-md
              backdrop-blur-sm
              opacity-0
              transition-all duration-200
              hover:bg-background
              group-hover:opacity-100
            "
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next banner"
            className="
              absolute right-5 top-1/2 z-10
              flex h-10 w-10 -translate-y-1/2
              items-center justify-center
              rounded-full
              border border-border
              bg-background/90
              text-foreground
              shadow-md
              backdrop-blur-sm
              opacity-0
              transition-all duration-200
              hover:bg-background
              group-hover:opacity-100
            "
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
