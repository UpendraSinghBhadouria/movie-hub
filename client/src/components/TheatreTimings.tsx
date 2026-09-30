"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Circle, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

type ShowSearchResponse = {
  movie: {
    id: string;
    title: string;
    posterUrl: string | null;
    certificate: string | null;
    rating: number | null;
    durationMin: number | null;
  };

  date: string;
  city: string | null;

  theatres: Array<{
    theatreId: string;
    theatreName: string;
    brand: string | null;
    address: string;
    city: string;
    state: string;
    logoUrl: string | null;

    shows: Array<{
      id: string;
      screenId: string;
      screenName: string;
      startTime: string;
      endTime: string;
      format: string | null;
      cancellationAllowed: boolean;
      availableSeats: number;
      totalSeats: number;
      minPrice: number | null;
    }>;
  }>;
};

type TheatreTiming = {
  id: string;
  time: string;
  label: string;
  format: string;
  availableSeats: number;
  totalSeats: number;
  minPrice: number | null;
  cancellationAllowed: boolean;
};

type Theatre = {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  distance: string;
  cancellation: string;
  img: string | null;
  timings: TheatreTiming[];
};

type TheatreTimingsProps = {
  movieId: string;
  movieName: string;
  city: string;
};

type SelectedDate = {
  date: string;
  day: string;
  weekday: string;
  month: string;
};

const filters = [
  "2D",
  "3D",
  "Wheelchair Friendly",
  "Premium Seats",
  "Recliners",
  "IMAX",
  "PVR PXL",
  "4DX",
  "Laser",
  "Dolby Atmos",
];

function getDates(): SelectedDate[] {
  const dates: SelectedDate[] = [];

  const today = new Date();

  for (let index = 0; index < 7; index++) {
    const date = new Date(today);

    date.setDate(today.getDate() + index);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    dates.push({
      date: `${year}-${month}-${day}`,
      day: String(date.getDate()),
      weekday: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      month: date
        .toLocaleDateString("en-IN", {
          month: "short",
        })
        .toUpperCase(),
    });
  }

  return dates;
}

function formatShowTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getShowLabel(availableSeats: number, totalSeats: number) {
  if (totalSeats === 0) {
    return "No seats";
  }

  const percentage = (availableSeats / totalSeats) * 100;

  if (percentage <= 15) {
    return "Almost full";
  }

  if (percentage <= 35) {
    return "Filling fast";
  }

  return "Available";
}

function getTimingHighlight(availableSeats: number, totalSeats: number) {
  if (totalSeats === 0) {
    return false;
  }

  return availableSeats / totalSeats <= 35 / 100;
}

function getTheatreLogo(logoUrl: string | null): string | null {
  return logoUrl;
}

async function fetchShows(
  movieId: string,
  date: string,
  city: string,
): Promise<ShowSearchResponse> {
  const response = await api.get<ShowSearchResponse>("/shows/search", {
    params: {
      movieId,
      date,
      city,
    },
  });

  return response.data;
}

export function TheatreTimings({
  movieId,
  city,
  movieName,
}: TheatreTimingsProps) {
  const dates = useMemo(() => getDates(), []);

  const [selectedDate, setSelectedDate] = useState(dates[0]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ["movie-shows", movieId, city, selectedDate.date],

    queryFn: () => fetchShows(movieId, selectedDate.date, city),

    enabled: Boolean(movieId) && Boolean(city) && Boolean(selectedDate.date),

    staleTime: 30 * 1000,
  });

  const theatres = useMemo<Theatre[]>(() => {
    if (!data?.theatres) {
      return [];
    }

    return data.theatres.map((theatre) => ({
      id: theatre.theatreId,

      name: theatre.theatreName,

      brand: theatre.brand,

      address: theatre.address,

      /*
       * Distance is not currently returned
       * by the backend.
       *
       * Keep it empty until we implement
       * distance calculation.
       */
      distance: "",

      cancellation: theatre.shows.some((show) => show.cancellationAllowed)
        ? "Allows cancellation"
        : "Cancellation unavailable",

      img: getTheatreLogo(theatre.logoUrl),

      timings: theatre.shows.map((show) => ({
        id: show.id,

        time: formatShowTime(show.startTime),

        label: getShowLabel(show.availableSeats, show.totalSeats),

        format: show.format ?? "2D",

        availableSeats: show.availableSeats,

        totalSeats: show.totalSeats,

        minPrice: show.minPrice,

        cancellationAllowed: show.cancellationAllowed,
      })),
    }));
  }, [data]);

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      {/* Format filters */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {filters.map((filter, index) => (
            <Button
              key={filter}
              variant="outline"
              size="sm"
              className={cn(
                "h-9 rounded-lg px-4 text-xs font-medium",
                "border-border bg-background",
                "transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                index === 0 && "border-primary/40 bg-primary/5 text-primary",
              )}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Availability legend */}
      <div
        className={cn(
          "flex items-center gap-5 rounded-md border px-4 py-2.5",
          "border-border bg-muted/50",
        )}
      >
        <LegendItem
          className="fill-foreground text-foreground"
          label="Available"
        />

        <LegendItem
          className="fill-yellow-400 text-yellow-400"
          label="Filling fast"
        />

        <LegendItem className="fill-red-400 text-red-400" label="Almost full" />
      </div>

      {/* Date selector */}
      <div className="flex w-full items-center gap-2">
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

        <div className="w-full overflow-x-auto scrollbar-none">
          <div className="flex min-w-max justify-start gap-1">
            {dates.map((date) => {
              const selected = selectedDate.date === date.date;

              return (
                <button
                  key={date.date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  aria-pressed={selected}
                  className={cn(
                    "flex h-18 w-16 shrink-0 flex-col items-center justify-center",
                    "rounded-lg border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",

                    selected
                      ? "border-foreground bg-foreground text-background shadow-sm"
                      : "border-transparent bg-background text-foreground hover:border-primary/30 hover:bg-primary/5",
                  )}
                >
                  <span className="text-base font-semibold leading-none">
                    {date.day}
                  </span>

                  <span
                    className={cn(
                      "mt-1 text-[11px] font-medium",
                      selected ? "opacity-100" : "text-muted-foreground",
                    )}
                  >
                    {date.weekday}
                  </span>

                  <span
                    className={cn(
                      "text-[9px] font-medium",
                      selected ? "opacity-70" : "text-muted-foreground",
                    )}
                  >
                    {date.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-40 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading shows...
          </div>
        </div>
      )}

      {/* Refetch indicator */}
      {!isLoading && isFetching && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Updating shows...
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-5 text-sm text-destructive">
          Unable to load shows for this date.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && theatres.length === 0 && (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed">
          <div className="text-center">
            <p className="text-sm font-medium">No shows available</p>

            <p className="mt-1 text-xs text-muted-foreground">
              No shows were found for {selectedDate.day} {selectedDate.month}.
            </p>
          </div>
        </div>
      )}

      {/* Theatre list */}
      {!isLoading && !isError && theatres.length > 0 && (
        <div className="space-y-7">
          {theatres.map((theatre) => (
            <TheatreRow
              key={theatre.id}
              theatre={theatre}
              movieId={movieId}
              movieName={movieName}
              city={city}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TheatreRow({
  theatre,
  movieId,
  movieName,
  city,
}: {
  theatre: Theatre;
  movieId: string;
  movieName: string;
  city: string;
}) {
  return (
    <article className="group">
      {/* Theatre information */}
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center",
            "overflow-hidden rounded-lg border border-border",
            "bg-background",
          )}
        >
          {theatre.img ? (
            <Image
              src={theatre.img}
              alt={`${theatre.name} logo`}
              fill
              sizes="44px"
              className="object-contain p-1.5"
            />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">
              {theatre.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Name + metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold tracking-tight">
              {theatre.name}
            </h3>

            {theatre.distance && (
              <span className="text-xs text-muted-foreground">
                • {theatre.distance}
              </span>
            )}
          </div>

          {/* <p className="mt-0.5 text-xs text-muted-foreground">
            {theatre.address}
          </p> */}

          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",

                theatre.cancellation === "Allows cancellation"
                  ? "bg-primary/10 text-primary hover:bg-primary/10"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {theatre.cancellation}
            </Badge>
          </div>
        </div>
      </div>

      {/* Timings */}
      <div className="mt-3 ml-0 flex flex-wrap gap-2 sm:ml-14">
        {theatre.timings.map((timing) => (
          <ShowTimeButton
            key={timing.id}
            timing={timing}
            theatreId={theatre.id}
            movieId={movieId}
            movieName={movieName}
            city={city}
          />
        ))}
      </div>
    </article>
  );
}

function ShowTimeButton({
  timing,
  theatreId,
  movieId,
  movieName,
  city,
}: {
  timing: TheatreTiming;
  theatreId: string;
  movieId: string;
  movieName: string;
  city: string;
}) {
  const router = useRouter();

  const highlight = getTimingHighlight(
    timing.availableSeats,
    timing.totalSeats,
  );

  const handleClick = () => {
    const encodedMovieName = encodeURIComponent(movieName);
    const encodedCity = encodeURIComponent(city).toLocaleLowerCase()

    // router.push(
    //   `/movies/${movieId}/${encodedMovieName}/${encodedCity}/theater/${theatreId}/show/${timing.id}/seat-layout`,
    // );

    router.push(`/movies/${encodedCity}/seat-layout/${movieId}/${timing.id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={timing.availableSeats === 0}
      className={cn(
        "group/time relative flex min-w-33 flex-col",
        "items-center justify-center rounded-xl border",
        "bg-background px-4 py-2.5 transition-all duration-200",
        "border-border",
        "hover:-translate-y-0.5",
        "hover:border-primary/40",
        "hover:bg-primary/5",
        "hover:shadow-sm",

        highlight &&
          "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_10%,transparent)]",

        timing.availableSeats === 0 &&
          "cursor-not-allowed opacity-50 hover:translate-y-0 hover:border-border hover:bg-background hover:shadow-none",
      )}
    >
      {/* Highlight indicator */}
      {highlight && (
        <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
          <span className="size-1.5 rounded-full bg-primary-foreground" />
        </span>
      )}

      <span
        className={cn("text-sm font-semibold", highlight && "text-primary")}
      >
        {timing.time}
      </span>

      {/* <span className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
        {timing.format}
        {timing.minPrice !== null && ` • ₹${timing.minPrice}`}
      </span> */}

      <span
        className={cn(
          "mt-0.5 text-[10px] font-medium tracking-wide",
          timing.label === "Almost full"
            ? "text-red-400"
            : timing.label === "Filling fast"
              ? "text-yellow-500"
              : "text-muted-foreground",
        )}
      >
        {/* {timing.label} */}
        RECLINERS
      </span>
    </button>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Circle className={cn("size-2.5 fill-current stroke-0", className)} />

      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// "use client";

// import Image, { type StaticImageData } from "next/image";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { CalendarDays, ChevronLeft, ChevronRight, Circle } from "lucide-react";
// import { useState } from "react";

// type TheatreTiming = {
//   time: string;
//   label: string;
//   highlight?: boolean;
// };

// type Theatre = {
//   name: string;
//   distance: string;
//   cancellation: string;
//   img: StaticImageData | string;
//   timings: TheatreTiming[];
// };

// type TheatreTimingsProps = {
//   theatres: Theatre[];
// };

// const filters = [
//   "2D",
//   "3D",
//   "Wheelchair Friendly",
//   "Premium Seats",
//   "Recliners",
//   "IMAX",
//   "PVR PXL",
//   "4DX",
//   "Laser",
//   "Dolby Atmos",
// ];

// const dates = [
//   { day: "19", weekday: "Fri", month: "SEP" },
//   { day: "20", weekday: "Sat", month: "SEP" },
//   { day: "21", weekday: "Sun", month: "SEP" },
//   { day: "22", weekday: "Mon", month: "SEP" },
//   { day: "23", weekday: "Tue", month: "SEP" },
//   { day: "24", weekday: "Wed", month: "SEP" },
//   { day: "25", weekday: "Thu", month: "SEP" },
// ];

// export function TheatreTimings({ theatres }: TheatreTimingsProps) {
//   const [selectedDate, setSelectedDate] = useState(dates[0]);

//   console.log("@@sleected date",selectedDate)
//   return (
//     <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-4">
//       {/* Format filters */}
//       <div className="overflow-x-auto pb-1">
//         <div className="flex min-w-max gap-2">
//           {filters.map((filter, index) => (
//             <Button
//               key={filter}
//               variant="outline"
//               size="sm"
//               className={cn(
//                 "h-9 rounded-lg px-4 text-xs font-medium",
//                 "border-border bg-background",
//                 "transition-all duration-200",
//                 "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
//                 index === 0 && "border-primary/40 bg-primary/5 text-primary",
//               )}
//             >
//               {filter}
//             </Button>
//           ))}
//         </div>
//       </div>

//       {/* Availability legend */}
//       <div
//         className={cn(
//           "flex items-center gap-5 rounded-md border px-4 py-2.5",
//           "bg-muted/50 border-border",
//         )}
//       >
//         <LegendItem
//           className="fill-foreground text-foreground"
//           label="Available"
//         />

//         <LegendItem
//           className="fill-yellow-400 text-yellow-400"
//           label="Filling fast"
//         />

//         <LegendItem className="fill-red-400 text-red-400" label="Almost full" />
//       </div>

//       {/* Date selector */}

//       <div className="w-full overflow-x-auto scrollbar-none">
//         <div className="flex min-w-max justify-start gap-1">
//           {dates.map((date) => {
//             const selected =
//               selectedDate.day === date.day &&
//               selectedDate.month === date.month;

//             return (
//               <button
//                 key={`${date.day}-${date.month}`}
//                 type="button"
//                 onClick={() => setSelectedDate(date)}
//                 aria-pressed={selected}
//                 className={cn(
//                   "flex h-18 w-16 shrink-0 flex-col items-center justify-center",
//                   "rounded-lg border transition-all duration-200",
//                   "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
//                   selected
//                     ? "border-foreground bg-foreground text-background shadow-sm"
//                     : "border-transparent bg-background text-foreground hover:border-primary/30 hover:bg-primary/5",
//                 )}
//               >
//                 <span className="text-base font-semibold leading-none">
//                   {date.day}
//                 </span>

//                 <span
//                   className={cn(
//                     "mt-1 text-[11px] font-medium",
//                     selected ? "opacity-100" : "text-muted-foreground",
//                   )}
//                 >
//                   {date.weekday}
//                 </span>

//                 <span
//                   className={cn(
//                     "text-[9px] font-medium",
//                     selected ? "opacity-70" : "text-muted-foreground",
//                   )}
//                 >
//                   {date.month}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Theatre list */}
//       <div className="space-y-7">
//         {theatres.map((theatre) => (
//           <TheatreRow key={theatre.name} theatre={theatre} />
//         ))}
//       </div>
//     </section>
//   );
// }

// function TheatreRow({ theatre }: { theatre: Theatre }) {
//   return (
//     <article className="group">
//       {/* Theatre information */}
//       <div className="flex items-start gap-3">
//         {/* Logo */}
//         <div
//           className={cn(
//             "relative flex size-11 shrink-0 items-center justify-center",
//             "overflow-hidden rounded-lg border border-border",
//             "bg-background",
//           )}
//         >
//           <Image
//             src={theatre.img}
//             alt={`${theatre.name} logo`}
//             fill
//             sizes="44px"
//             className="object-contain p-1.5"
//           />
//         </div>

//         {/* Name + metadata */}
//         <div className="min-w-0 flex-1">
//           <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
//             <h3 className="text-sm font-semibold tracking-tight">
//               {theatre.name}
//             </h3>

//             <span className="text-xs text-muted-foreground">
//               • {theatre.distance}
//             </span>
//           </div>

//           <div className="mt-1 flex items-center gap-2">
//             <Badge
//               variant="secondary"
//               className={cn(
//                 "rounded-full px-2 py-0.5 text-[10px] font-medium",
//                 theatre.cancellation === "Allows cancellation"
//                   ? "bg-primary/10 text-primary hover:bg-primary/10"
//                   : "bg-muted text-muted-foreground",
//               )}
//             >
//               {theatre.cancellation}
//             </Badge>
//           </div>
//         </div>
//       </div>

//       {/* Timings */}
//       <div className="mt-3 ml-0 flex flex-wrap gap-2 sm:ml-14">
//         {theatre.timings.map((timing, index) => (
//           <ShowTimeButton
//             key={`${timing.time}-${timing.label}-${index}`}
//             timing={timing}
//           />
//         ))}
//       </div>
//     </article>
//   );
// }

// function ShowTimeButton({ timing }: { timing: TheatreTiming }) {
//   return (
//     <button
//       type="button"
//       className={cn(
//         "group/time relative flex min-w-33 flex-col",
//         "items-center justify-center rounded-xl border",
//         "px-4 py-2.5 transition-all duration-200",
//         "bg-background",
//         "border-border",
//         "hover:-translate-y-0.5",
//         "hover:border-primary/40",
//         "hover:bg-primary/5",
//         "hover:shadow-sm",
//         timing.highlight &&
//           "border-primary/40 bg-primary/5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_10%,transparent)]",
//       )}
//     >
//       {/* Highlight indicator */}
//       {timing.highlight && (
//         <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
//           <span className="size-1.5 rounded-full bg-primary-foreground" />
//         </span>
//       )}

//       <span
//         className={cn(
//           "text-sm font-semibold",
//           timing.highlight && "text-primary",
//         )}
//       >
//         {timing.time}
//       </span>

//       <span
//         className={cn(
//           "mt-0.5 text-[10px] font-medium tracking-wide",
//           "text-muted-foreground",
//           timing.highlight && "text-primary/80",
//         )}
//       >
//         {timing.label}
//       </span>
//     </button>
//   );
// }

// function LegendItem({
//   label,
//   className,
// }: {
//   label: string;
//   className?: string;
// }) {
//   return (
//     <div className="flex items-center gap-1.5">
//       <Circle className={cn("size-2.5 fill-current stroke-0", className)} />
//       <span className="text-[11px] text-muted-foreground">{label}</span>
//     </div>
//   );
// }
