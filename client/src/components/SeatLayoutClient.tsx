"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MonitorPlay,
  Ticket,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Seat, SeatSection, ShowSeatResponse } from "@/types";
import api from "@/lib/axios";
import LegendItem from "./LegendItem";
import SeatCategorySection from "./SeatCategorySection";
import { useRouter } from "next/navigation";
import { useSeatLock } from "@/hooks/useSeatLock";
import { useSeatContext } from "@/hooks/useSeatContext";

// type SeatLayoutClientProps = {
//   movieId: string;
//   movieName: string;
//   city: string;
//   theaterId: string;
//   showId: string;
// };

type SeatLayoutClientProps = {
  movieId?: string;
  city: string;
  showId: string;
};

const fetchShowSeats = async (showId: string): Promise<ShowSeatResponse> => {
  const response = await api.get<ShowSeatResponse>(`/shows/${showId}/seats`);

  return response.data;
};

function formatShowTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const formatShowSelectedDate = (startTime?: string) => {
  if (!startTime) return null;
  const date = startTime.split("T")[0];

  const [year, month, day] = date.split("-").map(Number);

  const localDate = new Date(year, month - 1, day);

  return {
    date,
    weekday: localDate.toLocaleDateString("en-US", {
      weekday: "short",
    }),
    day: String(day),
    month: localDate.toLocaleDateString("en-US", {
      month: "short",
    }),
  };
};

function formatShowDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapSeatStatus(
  status: ShowSeatResponse["seats"][number]["status"],
): Seat["status"] {
  if (status === "booked" || status === "reserved" || status === "blocked") {
    return "booked";
  }

  return "available";
}

export default function SeatLayoutClient({
  // movieId,
  // movieName,
  city,
  // theaterId,
  showId,
}: SeatLayoutClientProps) {
  const [selectedDate, setSelectedDate] = React.useState("");
  const { selectedSeats, setSelectedSeats } = useSeatContext();
  const { handleSeatClick, lockedByOthers, remainingSeconds } = useSeatLock({
    showId,
    selectedSeats,
    setSelectedSeats,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["show-seats", showId],
    queryFn: () => fetchShowSeats(showId),
    enabled: Boolean(showId),
    staleTime: 0,
  });

  const show = data?.show;

  const theatre = data?.theatre.name;
  const screen = data?.screen.name;

  const showTime = show ? formatShowTime(show.startTime) : "--";
  const showDate = show ? formatShowDate(show.startTime) : "--";

  // const dates = React.useMemo(() => {
  //   if (!show?.startTime) {
  //     return [];
  //   }

  //   const showDateValue = new Date(show.startTime);

  //   const datesList = [];

  //   for (let index = 0; index < 7; index++) {
  //     const date = new Date(showDateValue);
  //     date.setDate(showDateValue.getDate() + index);

  //     datesList.push({
  //       date: date.toISOString().slice(0, 10),
  //       day: String(date.getDate()),
  //       weekday: date.toLocaleDateString("en-IN", {
  //         weekday: "short",
  //       }),
  //       month: date
  //         .toLocaleDateString("en-IN", {
  //           month: "short",
  //         })
  //         .toUpperCase(),
  //     });
  //   }

  //   return datesList;
  // }, [show?.startTime]);

  const dates = React.useMemo(() => {
    if (!show?.startTime) {
      return [];
    }

    const [year, month, day] = show.startTime
      .split("T")[0]
      .split("-")
      .map(Number);

    const showDate = new Date(year, month - 1, day);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(showDate);
      date.setDate(showDate.getDate() + (index - 3));

      const dateValue = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      return {
        date: dateValue,
        day: String(date.getDate()),
        weekday: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        month: date
          .toLocaleDateString("en-IN", {
            month: "short",
          })
          .toUpperCase(),
      };
    });
  }, [show?.startTime]);
  const showSelectedDate = formatShowSelectedDate(show?.startTime);

  React.useEffect(() => {
    if (show?.startTime) {
      const date = new Date(show.startTime);

      setSelectedDate(
        date.toLocaleDateString("en-IN", {
          day: "numeric",
        }),
      );
    }
  }, [show?.startTime]);

  const seats = React.useMemo<Seat[]>(() => {
    if (!data?.seats) {
      return [];
    }

    return data.seats.map((seat) => ({
      id: seat.id,
      seatId: seat.seatId,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      price: Number(seat.price),
      status: mapSeatStatus(seat.status),
    }));
  }, [data?.seats]);

  const seatSections = React.useMemo<SeatSection[]>(() => {
    if (!data?.sections) {
      return [];
    }

    return data.sections
      .map((section) => ({
        category: section.category,
        label: section.category,
        price: section.price,
        seatCount: seats.filter((seat) => seat.category === section.category)
          .length,
      }))
      .sort((a, b) => {
        const order: Record<string, number> = {
          normal: 1,
          executive: 2,
          premium: 3,
        };

        return (
          order[a.category.toLowerCase()] - order[b.category.toLowerCase()]
        );
      });
  }, [data?.sections, seats]);

  const getSeatPrice = (seatId: string) => {
    const apiSeat = data?.seats.find((item) => item.id === seatId);

    if (apiSeat) {
      return Number(apiSeat.price);
    }

    const seat = seats.find((item) => item.id === seatId);

    if (!seat) {
      return 0;
    }

    return (
      seatSections.find((section) => section.category === seat.category)
        ?.price ?? 0
    );
  };

  const getSeatLabel = (seatId: string): string => {
    const seat = seats.find((seat) => seat.id === seatId);

    return seat ? `${seat.row}${seat.number}` : seatId;
  };

  const totalAmount = selectedSeats.reduce(
    (total, seatId) => total + getSeatPrice(seatId),
    0,
  );

  const router = useRouter();
  const handleProceed = () => {
    router.push(`/shows/${show?.id}/checkout`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <section className="border-b border-border/60 bg-background">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-6 w-64 rounded bg-muted" />
              <div className="mt-3 h-4 w-80 rounded bg-muted" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-10">
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </div>
        </section>
      </div>
    );
  }

  if (isError || !data || !show || !theatre || !screen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold">
              Unable to load seat layout
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              We could not load the seats for this show.
            </p>

            <Button
              className="mt-5 rounded-xl"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <section className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            {/* Movie / Show Information */}
            <div className="flex min-w-0 items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 shrink-0 rounded-full"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="size-5" />
              </Button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-bold sm:text-xl">
                    {data?.movie?.title}
                  </h1>

                  <Badge
                    variant="outline"
                    className="border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400"
                  >
                    {show.format ?? "2D"}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-pink-500" />
                    {data.theatre.name}, {city}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5 text-pink-500" />
                    {showTime}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MonitorPlay className="size-3.5 text-pink-500" />
                    {data.screen.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Seat Lock Timer */}
            {selectedSeats.length > 0 && (
              <div
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2",
                  remainingSeconds <= 30
                    ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
                    : "border-pink-200 bg-pink-50 dark:border-pink-900/50 dark:bg-pink-950/30",
                )}
              >
                <div
                  className={cn(
                    "size-2 rounded-full",
                    remainingSeconds <= 30
                      ? "animate-pulse bg-red-500"
                      : "bg-pink-500",
                  )}
                />

                <div className="leading-none">
                  <p className="hidden text-[10px] text-muted-foreground sm:block">
                    Seats held for
                  </p>

                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      remainingSeconds <= 30
                        ? "text-red-600 dark:text-red-400"
                        : "text-pink-600 dark:text-pink-400",
                    )}
                  >
                    {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}
                    :{String(remainingSeconds % 60).padStart(2, "0")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Date selector */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Selected date
              </p>
            </div>

            <div className="hidden items-center gap-1 sm:flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {dates.map((date) => {
              const active = date.date === showSelectedDate?.date;

              return (
                <button
                  key={date.date}
                  type="button"
                  disabled={!active}
                  onClick={() => setSelectedDate(date.date)}
                  className={cn(
                    "flex min-w-18 flex-col items-center rounded-xl border px-4 py-2.5 transition-all",
                    active
                      ? "border-pink-500 bg-pink-500 text-white shadow-sm shadow-pink-500/20"
                      : "cursor-not-allowed opacity-70 border-border/70 bg-background hover:border-pink-500/30 hover:bg-pink-500/5",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      active ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {date.weekday}
                  </span>

                  <span className="mt-0.5 text-lg font-bold">{date.day}</span>

                  <span
                    className={cn(
                      "text-[10px]",
                      active ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {date.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Show information */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Card className="border-pink-500/10 bg-pink-500/2.5 shadow-none">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Ticket className="size-5" />
              </div>

              <div>
                <p className="font-semibold">{data.theatre.name}</p>

                <p className="text-sm text-muted-foreground">
                  {data.theatre.address}, {city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground">{showDate}</p>

                <p className="font-semibold text-pink-600 dark:text-pink-400">
                  {showTime}
                </p>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <Badge
                variant="secondary"
                className="bg-pink-500/10 text-pink-600 dark:text-pink-400"
              >
                {data.screen.name}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seat selection */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Select your seats</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose your preferred seats for this show
          </p>
        </div>

        {/* Seat legend */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
          <LegendItem
            className="border-pink-500/50 bg-pink-500/10"
            label="Available"
          />

          <LegendItem
            className="border-pink-500 bg-pink-500 text-white"
            label="Selected"
          />

          <LegendItem
            className="border-muted bg-muted text-muted-foreground"
            label="Sold"
          />
        </div>

        {/* Screen */}
        <div className="mx-auto mb-12 max-w-3xl">
          <div className="relative mx-auto h-12 w-[85%] overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-16 w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-t-4 border-pink-400/70 shadow-[0_-8px_30px_rgba(236,72,153,0.12)]" />

            <div className="absolute inset-x-0 bottom-0 text-center text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Screen
            </div>
          </div>
        </div>

        {/* Seat sections */}
        <div className="mx-auto max-w-4xl space-y-10">
          {seatSections.map((section) => (
            <SeatCategorySection
              key={section.category}
              section={section}
              seats={seats.filter((seat) => seat.category === section.category)}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              lockedByOthers={lockedByOthers}
            />
          ))}
        </div>
      </section>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:shadow-[0_-8px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {selectedSeats.length === 0
                ? "No seats selected"
                : `${selectedSeats.length} ${
                    selectedSeats.length === 1 ? "seat" : "seats"
                  } selected`}
            </p>

            {selectedSeats.length > 0 && (
              <p className="mt-0.5 truncate text-sm font-medium">
                {selectedSeats.map(getSeatLabel).join(", ")}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {selectedSeats.length > 0 && (
              <div className="hidden text-right sm:block">
                <p className="text-xs text-muted-foreground">Total</p>

                <p className="font-bold">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            )}

            <Button
              onClick={handleProceed}
              disabled={selectedSeats.length === 0}
              className="h-11 rounded-xl bg-pink-600 px-5 text-white shadow-sm shadow-pink-500/20 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
            >
              Proceed
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
