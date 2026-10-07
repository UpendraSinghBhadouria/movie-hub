"use client";

import * as React from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Eye,
  Film,
  MapPin,
  MoreHorizontal,
  MoreVertical,
  ReceiptText,
  Ticket,
  XCircle,
} from "lucide-react";

import type { Booking, BookingResponse } from "@/types/booking.types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getDisplayStatus,
  getMoviePoster,
} from "@/utils";
import { useRouter } from "next/navigation";

function StatusBadge({ booking }: { booking: Booking }) {
  const status = getDisplayStatus(booking);

  if (status === "confirmed") {
    return (
      <Badge
        className="
          gap-1.5
          border border-emerald-500/20
          bg-emerald-500/10
          text-emerald-600
          hover:bg-emerald-500/10
          dark:text-emerald-400
        "
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Confirmed
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge
        variant="secondary"
        className="
          gap-1.5
          border 
          border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400
        "
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge
        className="
          gap-1.5
          border border-destructive/20
          bg-destructive/10
          text-destructive
          hover:bg-destructive/10
        "
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </Badge>
    );
  }

  return (
    <Badge
      className="
        gap-1.5
        border border-amber-500/20
        bg-amber-500/10
        text-amber-600
        hover:bg-amber-500/10
        dark:text-amber-400
      "
    >
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </Badge>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-xl
            bg-pink-500/10
            text-pink-600
            dark:text-pink-400
          "
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>

          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{value}</p>

            <span className="truncate text-xs text-muted-foreground">
              {description}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const status = getDisplayStatus(booking);

  const isCancelled = status === "cancelled";

  return (
    <Card
      className="
        group
        overflow-hidden
        border-border/60
        bg-card
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:border-pink-500/30
        hover:shadow-lg
        hover:shadow-pink-500/5
      "
    >
      <CardHeader className="border-b border-border/50 p-0">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg
                bg-pink-500/10
                text-pink-600
                dark:text-pink-400
              "
            >
              <Ticket className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Booking Number</p>

              <p className="truncate text-sm font-semibold">
                {booking.bookingNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge booking={booking} />

            <DropdownMenu>
              <DropdownMenuTrigger
                className="
      inline-flex
      size-8
      shrink-0
      items-center
      justify-center
      rounded-full
      border-0
      bg-transparent
      p-0
      text-muted-foreground
      outline-none
      transition-colors
      hover:bg-muted
      hover:text-foreground
      focus-visible:ring-2
      focus-visible:ring-pink-500/50
    "
              >
                <MoreVertical className="size-4" />
                <span className="sr-only">Booking actions</span>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="
      w-48
      border-border/60
      bg-popover/95
      shadow-lg
      backdrop-blur
    "
              >
                <DropdownMenuItem>
                  <CreditCard className="mr-2 size-4" />
                  Payment details
                </DropdownMenuItem>

                {!isCancelled && (
                  <DropdownMenuItem>
                    <Download className="mr-2 size-4" />
                    Download ticket
                  </DropdownMenuItem>
                )}

                {booking.status === "CONFIRMED" && (
                  <DropdownMenuItem
                    className="
          text-destructive
          focus:bg-destructive/10
          focus:text-destructive
        "
                  >
                    <XCircle className="mr-2 size-4" />
                    Cancel booking
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          {/* Poster */}
          <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-40 sm:w-28">
            {booking.movie.posterUrl ? (
              <Image
                src={getMoviePoster(booking.movie.posterUrl)}
                alt={booking.movie.title}
                fill
                className="
                  h-full
                  w-full
                  object-cover
                  transition-transform
                  duration-500
                  group-hover:scale-105
                "
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}

            {booking.movie.rating !== null && (
              <div
                className="
                  absolute
                  bottom-2
                  left-2
                  rounded-md
                  bg-black/70
                  px-2
                  py-1
                  text-xs
                  font-semibold
                  text-white
                  backdrop-blur
                "
              >
                ★ {booking.movie.rating}
              </div>
            )}
          </div>

          {/* Movie details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    {booking.movie.title}
                  </h3>

                  {booking.movie.certificate && (
                    <Badge variant="outline" className="text-xs">
                      {booking.movie.certificate}
                    </Badge>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.show.format}
                  {" • "}
                  {booking.screen.name}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* Theatre */}
              <div className="flex gap-3">
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-lg
                    bg-pink-500/10
                    text-pink-600
                    dark:text-pink-400
                  "
                >
                  <MapPin className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Theatre</p>

                  <p className="truncate text-sm font-semibold">
                    {booking.theatre.name}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {booking.theatre.address}, {booking.theatre.city}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex gap-3">
                <div
                  className="
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-lg
                    bg-pink-500/10
                    text-pink-600
                    dark:text-pink-400
                  "
                >
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>

                  <p className="text-sm font-semibold">
                    {formatDate(booking.show.startTime)}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatTime(booking.show.startTime)}
                    {" – "}
                    {formatTime(booking.show.endTime)}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Seats */}
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Seats</p>

                <div className="flex flex-wrap gap-1.5">
                  {booking.seats.map((seat) => (
                    <Badge
                      key={seat.id}
                      variant="secondary"
                      className="
                        border
                        border-pink-500/15
                        bg-pink-500/5
                        text-foreground
                      "
                    >
                      {seat.row}
                      {seat.number}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground">Total Amount</p>

                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  {formatCurrency(booking.amount.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter
        className="
          flex flex-col items-start justify-between
          gap-3
          border-t
          border-border/50
          bg-muted/20
          px-5
          py-3.5
          sm:flex-row
          sm:items-center
        "
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Booked on {formatDate(booking.createdAt)}</span>

          {booking.payment && (
            <span className="flex items-center gap-1.5">
              <ReceiptText className="h-3.5 w-3.5" />
              {booking.payment.status}
            </span>
          )}

          {booking.offer && (
            <span className="text-pink-600 dark:text-pink-400">
              Offer: {booking.offer.code}
            </span>
          )}
        </div>

        <Button
          onClick={() => router.push(`/bookings/${booking.bookingNumber}`)}
          variant="ghost"
          size="sm"
          className="
            group/button
            text-pink-600
            hover:bg-pink-500/10
            hover:text-pink-700
            dark:text-pink-400
            dark:hover:text-pink-300
          "
        >
          View booking
          <ChevronRight
            className="
              ml-1
              h-4 w-4
              transition-transform
              group-hover/button:translate-x-0.5
            "
          />
        </Button>
      </CardFooter>
    </Card>
  );
}

function BookingSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex gap-5">
          <Skeleton className="h-40 w-28 shrink-0 rounded-xl" />

          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>

            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyBookings() {
  return (
    <Card className="border-dashed border-border/70 bg-card/50">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div
          className="
            flex h-16 w-16 items-center justify-center
            rounded-2xl
            bg-pink-500/10
            text-pink-600
            dark:text-pink-400
          "
        >
          <Ticket className="h-8 w-8" />
        </div>

        <h3 className="mt-5 text-lg font-semibold">No bookings yet</h3>

        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your movie bookings will appear here once you book your first show.
        </p>

        <Button
          className="
            mt-6
            bg-pink-600
            text-white
            hover:bg-pink-700
            dark:bg-pink-500
            dark:hover:bg-pink-600
          "
        >
          Explore Movies
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BookingHistory() {
  const {
    data: bookings,
    isLoading,
    isError,
    refetch,
  } = useQuery<BookingResponse>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await api.get<BookingResponse>("/bookings");
      return response.data;
    },
  });

  const upcomingCount = bookings?.filter(
    (booking) => getDisplayStatus(booking) === "confirmed",
  ).length;

  const completedCount = bookings?.filter(
    (booking) => getDisplayStatus(booking) === "completed",
  ).length;

  const cancelledCount = bookings?.filter(
    (booking) => getDisplayStatus(booking) === "cancelled",
  ).length;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section
        className="
          border-b
          border-border/60
          bg-linear-to-b
          from-pink-500/6
          via-background
          to-background
        "
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-pink-500/20
                  bg-pink-500/10
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-pink-600
                  dark:text-pink-400
                "
              >
                <Ticket className="h-3.5 w-3.5" />
                Your movie journey
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Bookings
              </h1>

              <p className="mt-2 text-muted-foreground">
                View and manage all your movie bookings
              </p>
            </div>

            <div className="rounded-xl border border-pink-500/10 bg-pink-500/5 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Total {bookings?.length === 1 ? "booking" : "bookings"}
              </p>
              <p className="mt-0.5 text-xl font-semibold text-pink-600 dark:text-pink-400">
                {bookings?.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary */}
        {!isLoading && !isError && (
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={<Clock3 className="h-5 w-5" />}
              label="Upcoming"
              value={upcomingCount ?? 0}
              description="shows"
            />

            <SummaryCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Completed"
              value={completedCount ?? 0}
              description="shows"
            />

            <SummaryCard
              icon={<XCircle className="h-5 w-5" />}
              label="Cancelled"
              value={cancelledCount ?? 0}
              description="bookings"
            />
          </div>
        )}

        {/* Content */}
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Booking History</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your recent movie bookings
              </p>
            </div>

            {isError && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="
                  border-pink-500/30
                  hover:bg-pink-500/10
                "
              >
                Try again
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <BookingSkeleton />
              <BookingSkeleton />
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="
                    flex h-14 w-14 items-center justify-center
                    rounded-2xl
                    bg-destructive/10
                    text-destructive
                  "
                >
                  <XCircle className="h-7 w-7" />
                </div>

                <h3 className="mt-4 font-semibold">Unable to load bookings</h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  Something went wrong while loading your booking history.
                </p>

                <Button onClick={() => refetch()} className="mt-5">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : bookings?.length === 0 ? (
            <EmptyBookings />
          ) : (
            <div className="space-y-4">
              {bookings?.map((booking) => (
                <BookingCard key={booking?.id} booking={booking} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
