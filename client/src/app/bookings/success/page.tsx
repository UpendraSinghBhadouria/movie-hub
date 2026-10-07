"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Film,
  MapPin,
  MonitorPlay,
  ReceiptText,
  Share2,
  Star,
  Ticket,
  UserRound,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/axios";
import type { Booking } from "@/types/booking.types";
import {
  formatCurrency,
  formatDate,
  formatTime,
  getMoviePoster,
  getPaymentStatus,
  handleDownloadTicket,
} from "@/utils";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const bookingNumber = searchParams.get("bookingNumber");

  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const {
    data: booking,
    isLoading,
    isError,
    refetch,
  } = useQuery<Booking>({
    queryKey: ["booking", bookingNumber],
    queryFn: async () => {
      const response = await api.get<Booking>(`/bookings/${bookingNumber}`);

      return response.data;
    },
    enabled: Boolean(bookingNumber),
  });

  const handleCopyBookingNumber = async () => {
    if (!booking?.bookingNumber) return;

    try {
      await navigator.clipboard.writeText(booking.bookingNumber);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleShare = async () => {
    if (!booking) return;

    const shareData = {
      title: `${booking.movie.title} - MovieHub`,
      text: `My booking for ${booking.movie.title} at ${booking.theatre.name}. Booking Number: ${booking.bookingNumber}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch {
      // User cancelled share dialog
    }
  };

  if (!bookingNumber) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-3xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Ticket className="size-7 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold">Booking not found</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find a booking reference in the URL.
            </p>

            <Button
              className="mt-6 rounded-xl bg-pink-600 px-6 hover:bg-pink-700"
              onClick={() => router.push("/movies")}
            >
              Explore Movies
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            {/* Top confirmation skeleton */}
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto size-20 rounded-full bg-muted" />

              <div className="mx-auto mt-5 h-8 w-64 rounded-lg bg-muted" />

              <div className="mx-auto mt-3 h-5 w-80 rounded-lg bg-muted" />

              <div className="mx-auto mt-6 h-10 w-64 rounded-full bg-muted" />
            </div>

            {/* Main card skeleton */}
            <div className="mt-10 overflow-hidden rounded-3xl border bg-card">
              <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
                <div className="space-y-8 p-6 sm:p-8 lg:p-10">
                  <div className="flex gap-5">
                    <div className="h-48 w-32 shrink-0 rounded-2xl bg-muted" />

                    <div className="flex-1 space-y-4">
                      <div className="h-7 w-2/3 rounded-lg bg-muted" />
                      <div className="h-5 w-1/3 rounded-lg bg-muted" />
                      <div className="h-5 w-1/2 rounded-lg bg-muted" />
                    </div>
                  </div>

                  <div className="h-px bg-muted" />

                  <div className="grid grid-cols-2 gap-5">
                    <div className="h-20 rounded-xl bg-muted" />
                    <div className="h-20 rounded-xl bg-muted" />
                  </div>

                  <div className="h-24 rounded-xl bg-muted" />
                </div>

                <div className="space-y-5 border-t p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                  <div className="h-7 w-40 rounded-lg bg-muted" />
                  <div className="h-16 rounded-xl bg-muted" />
                  <div className="h-16 rounded-xl bg-muted" />
                  <div className="h-16 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !booking) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-3xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Ticket className="size-7 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold">Unable to load booking</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't retrieve your booking details.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => refetch()}
              >
                Try Again
              </Button>

              <Button
                className="rounded-xl bg-pink-600 hover:bg-pink-700"
                onClick={() => {
                  window.location.href = "/movies";
                }}
              >
                Explore Movies
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Background glow */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          z-0
          h-105
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            left-1/2
            -top-55
            h-125
            w-175
            -translate-x-1/2
            rounded-full
            bg-pink-500/10
            blur-3xl
            dark:bg-pink-500/5
          "
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* ============================================================
            TOP SUCCESS SECTION
        ============================================================ */}

        <section className="mx-auto max-w-3xl text-center">
          {/* Success icon */}
          <div className="relative mx-auto flex size-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-pink-500/10" />

            <div className="relative flex size-16 items-center justify-center rounded-full border-8 border-pink-500/15 bg-pink-500/10">
              <div className="flex size-11 items-center justify-center rounded-full bg-pink-600 shadow-lg shadow-pink-600/25">
                <Check className="size-6 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Booking Confirmed
          </h1>

          <p className="mt-2 text-base text-muted-foreground sm:text-lg">
            You&apos;re all set! Your tickets have been booked successfully.
          </p>

          {/* Booking number */}
          <div className="mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
            <Ticket className="size-4 shrink-0 text-pink-600" />

            <span className="text-xs font-medium text-muted-foreground sm:text-sm">
              Booking Number
            </span>

            <span className="max-w-45 truncate text-xs font-bold tracking-wide sm:max-w-none sm:text-sm">
              {booking.bookingNumber}
            </span>

            <button
              type="button"
              onClick={handleCopyBookingNumber}
              className="ml-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Copy booking number"
            >
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </section>

        {/* ============================================================
            MAIN BOOKING CARD
            Desktop: 70% left / 30% right
        ============================================================ */}
        <section className="mt-10 overflow-hidden rounded-3xl border bg-card shadow-sm sm:mt-12">
          <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
            {/* ========================================================
                LEFT - BOOKING DETAILS - 70%
            ======================================================== */}
            <div className="min-w-0 p-5 sm:p-7 lg:p-10">
              {/* Movie information */}
              <div className="flex flex-col gap-6 sm:flex-row">
                {/* Poster */}
                <div className="mx-auto w-32 shrink-0 sm:mx-0 sm:w-36">
                  <div className="relative aspect-2/3 overflow-hidden rounded-2xl border bg-muted shadow-sm">
                    {booking.movie.posterUrl ? (
                      <img
                        src={getMoviePoster(booking.movie.posterUrl)}
                        alt={booking.movie.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Film className="size-10 text-muted-foreground" />
                      </div>
                    )}

                    {/* Rating badge */}
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      {booking.movie.rating}
                    </div>
                  </div>
                </div>

                {/* Movie details */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 text-xs"
                    >
                      {booking.movie.certificate}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="rounded-full border-pink-500/30 bg-pink-500/5 px-2.5 py-0.5 text-xs text-pink-600 dark:text-pink-400"
                    >
                      {booking.show.format}
                    </Badge>
                  </div>

                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {booking.movie.title}
                  </h2>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {booking.movie.rating}
                    </span>
                    <span>Movie Rating</span>
                  </div>

                  {/* Theatre */}
                  <div className="mt-6 flex items-start justify-center gap-3 sm:justify-start">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10">
                      <MapPin className="size-5 text-pink-600 dark:text-pink-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {booking.theatre.name}
                      </p>

                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {booking.theatre.address}, {booking.theatre.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* ======================================================
                  SHOW INFORMATION
              ====================================================== */}
              <div>
                <div className="mb-5 flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-pink-500/10">
                    <CalendarDays className="size-4 text-pink-600 dark:text-pink-400" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Show Details</h3>

                    <p className="text-xs text-muted-foreground">
                      Your movie schedule
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* Date */}
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {formatDate(booking.show.startTime)}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Time
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {formatTime(booking.show.startTime)}
                    </p>
                  </div>

                  {/* Screen */}
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Screen
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {booking.screen.name}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      End Time
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {formatTime(booking.show.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* ======================================================
                  SEATS
              ====================================================== */}
              <div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-pink-500/10">
                      <Ticket className="size-4 text-pink-600 dark:text-pink-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold">Your Seats</h3>

                      <p className="text-xs text-muted-foreground">
                        {booking.seats.length}{" "}
                        {booking.seats.length === 1 ? "ticket" : "tickets"}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="mr-1 size-3.5" />
                    Confirmed
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3">
                  {booking.seats.map((seat) => (
                    <div
                      key={seat.id}
                      className="group relative min-w-20 overflow-hidden rounded-xl border bg-muted/30 px-4 py-3 text-center transition-colors hover:border-pink-500/40 hover:bg-pink-500/5"
                    >
                      <p className="text-lg font-bold">
                        {seat.row}
                        {seat.number}
                      </p>

                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {seat.category}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-8" />

              {/* ======================================================
                  BOOKING INFORMATION
              ====================================================== */}
              <div>
                <div className="mb-5 flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-pink-500/10">
                    <ReceiptText className="size-4 text-pink-600 dark:text-pink-400" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Booking Information</h3>

                    <p className="text-xs text-muted-foreground">
                      Details associated with this booking
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 p-4">
                    <UserRound className="size-4 text-muted-foreground" />

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Booking Number
                      </p>

                      <p className="mt-0.5 truncate text-sm font-medium">
                        {booking.bookingNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 p-4">
                    <Clock3 className="size-4 text-muted-foreground" />

                    <div>
                      <p className="text-xs text-muted-foreground">Booked On</p>

                      <p className="mt-0.5 text-sm font-medium">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                RIGHT - PAYMENT SUMMARY - 30%
                Vertical divider on desktop
            ======================================================== */}
            <aside className="border-t bg-muted/18 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8 xl:p-10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-pink-500/10">
                  <CreditCard className="size-5 text-pink-600 dark:text-pink-400" />
                </div>

                <div>
                  <h3 className="font-semibold">Payment Summary</h3>

                  <p className="text-xs text-muted-foreground">
                    Transaction details
                  </p>
                </div>
              </div>

              {/* Payment status */}
              <div className="mt-6 rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <span className="text-sm font-medium">
                      {getPaymentStatus(booking.payment?.status)}
                    </span>
                  </div>

                  {booking.payment?.method && (
                    <Badge
                      variant="secondary"
                      className="rounded-full text-[10px]"
                    >
                      {booking.payment.method}
                    </Badge>
                  )}
                </div>

                {booking.payment?.provider && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Paid via {booking.payment.provider}
                  </p>
                )}
              </div>

              {/* Amount breakdown */}
              <div className="mt-7">
                <h4 className="mb-4 text-sm font-semibold">Price Breakdown</h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Tickets</span>

                    <span className="font-medium">
                      {formatCurrency(booking.amount.tickets)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Convenience Fee
                    </span>

                    <span className="font-medium">
                      {formatCurrency(booking.amount.convenienceFee)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Taxes</span>

                    <span className="font-medium">
                      {formatCurrency(booking.amount.taxes)}
                    </span>
                  </div>

                  {booking.amount.discount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Discount
                        {booking.offer?.code && (
                          <span className="ml-1 text-xs text-pink-600 dark:text-pink-400">
                            ({booking.offer.code})
                          </span>
                        )}
                      </span>

                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        -{formatCurrency(booking.amount.discount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Total */}
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Total Amount
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight">
                      {formatCurrency(booking.amount.total)}
                    </p>
                  </div>

                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Payment ID */}
              {booking.payment?.providerPaymentId && (
                <div className="mt-5 rounded-xl bg-muted/50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Payment ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {booking.payment.providerPaymentId}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-7 space-y-3">
                <Button
                  className="h-11 w-full rounded-xl bg-pink-600 font-semibold shadow-sm shadow-pink-600/20 hover:bg-pink-700"
                  onClick={() => handleDownloadTicket(booking)}
                >
                  <Download className="mr-2 size-4" />
                  Download Ticket
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl bg-background"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 size-4" />
                    Share
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 rounded-xl bg-background"
                    onClick={() => router.push("/bookings")}
                  >
                    <Ticket className="mr-2 size-4" />
                    My Bookings
                  </Button>
                </div>
              </div>

              {/* Support/info */}
              <div className="mt-7 rounded-2xl border border-pink-500/15 bg-pink-500/5 p-4">
                <div className="flex gap-3">
                  <MonitorPlay className="mt-0.5 size-4 shrink-0 text-pink-600 dark:text-pink-400" />

                  <div>
                    <p className="text-xs font-semibold">Enjoy your movie!</p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Please arrive at the theatre a few minutes before the show
                      starts.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ============================================================
            BOTTOM ACTIONS
        ============================================================ */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="w-full rounded-xl sm:w-auto p-5"
            onClick={() => router.push("/bookings")}
          >
            View My Bookings
          </Button>

          <Button
            className="w-full rounded-xl bg-pink-600 px-6 hover:bg-pink-700 sm:w-auto py-5"
            onClick={() => router.push("/movies")}
          >
            <Film className="mr-2 size-4" />
            Explore More Movies
          </Button>
        </div>

        {/* Small footer text */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Keep your booking number handy for theatre entry and support.
        </p>
      </div>
    </main>
  );
}
