"use client";

import * as React from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Film,
  MapPin,
  QrCode,
  ReceiptText,
  Ticket,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import api from "@/lib/axios";
import { cn } from "@/lib/utils";

import type { Booking } from "@/types/booking.types";

const getBooking = async (bookingNumber: string): Promise<Booking> => {
  const response = await api.get(`/bookings/${bookingNumber}`);

  return response.data;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const getStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return {
        label: "Confirmed",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
        icon: CheckCircle2,
      };

    case "CANCELLED":
      return {
        label: "Cancelled",
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
        icon: CheckCircle2,
      };

    case "EXPIRED":
      return {
        label: "Expired",
        className:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400",
        icon: Clock3,
      };

    default:
      return {
        label: status,
        className:
          "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900 dark:bg-pink-950/40 dark:text-pink-400",
        icon: Clock3,
      };
  }
};

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const bookingNumber = params.bookingNumber as string;

  const {
    data: booking,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["booking", bookingNumber],
    queryFn: () => getBooking(bookingNumber),
    enabled: Boolean(bookingNumber),
  });

  const copyBookingNumber = async () => {
    if (!booking) return;

    await navigator.clipboard.writeText(booking.bookingNumber);
  };

  if (isLoading) {
    return <BookingSkeleton />;
  }

  if (isError || !booking) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4">
          <Card className="w-full max-w-md border-pink-200 dark:border-pink-900">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 rounded-full bg-pink-100 p-4 dark:bg-pink-950/40">
                <Ticket className="size-8 text-pink-600 dark:text-pink-400" />
              </div>

              <h1 className="text-xl font-semibold">Booking not found</h1>

              <p className="mt-2 text-sm text-muted-foreground">
                We couldn't find this booking.
              </p>

              <Button
                className="mt-6 bg-pink-600 hover:bg-pink-700"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 size-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const status = getStatus(booking.status);
  const StatusIcon = status.icon;

  return (
    <main className="min-h-screen bg-linear-to-b from-pink-50/70 via-background to-background dark:from-pink-950/20">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            className="-ml-2 gap-2 hover:bg-pink-100 hover:text-pink-700 dark:hover:bg-pink-950/40"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Booking History
          </Button>

          <Button
            variant="outline"
            className="hidden border-pink-200 hover:bg-pink-50 hover:text-pink-700 sm:flex dark:border-pink-900 dark:hover:bg-pink-950/40"
          >
            <Download className="mr-2 size-4" />
            Download Ticket
          </Button>
        </div>

        {/* Main Ticket */}
        <Card className="overflow-hidden border-pink-200/70 shadow-lg shadow-pink-100/30 dark:border-pink-900/50 dark:shadow-pink-950/20">
          {/* Pink top border */}
          <div className="h-1.5 bg-linear-to-r from-pink-500 via-fuchsia-500 to-pink-600" />

          {/* Header */}
          <div className="flex flex-col gap-4 border-b bg-pink-50/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:bg-pink-950/10">
            <div>
              <p className="text-sm text-muted-foreground">Movie Booking</p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Booking Details
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Booking ID</p>

                <div className="mt-1 flex items-center gap-1">
                  <span className="font-semibold">{booking.bookingNumber}</span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 hover:bg-pink-100 dark:hover:bg-pink-950/40"
                    onClick={copyBookingNumber}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn("gap-1.5 px-3 py-1.5", status.className)}
              >
                <StatusIcon className="size-3.5" />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* 70 / 30 layout */}
          <div className="grid lg:grid-cols-[70%_30%]">
            {/* LEFT 70% */}
            <div className="p-5 sm:p-8">
              {/* Movie */}
              <div className="flex gap-5">
                <div className="h-32 w-22 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-40 sm:w-28">
                  {booking.movie.posterUrl ? (
                    <img
                      src={booking.movie.posterUrl}
                      alt={booking.movie.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold sm:text-2xl">
                      {booking.movie.title}
                    </h2>

                    <Badge variant="secondary">
                      {booking.movie.certificate}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-sm">
                    <span className="font-semibold text-yellow-600">
                      ★ {booking.movie.rating}
                    </span>

                    <span className="text-muted-foreground">/ 10</span>
                  </div>

                  {/* Show information */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoItem
                      icon={CalendarDays}
                      label="Date"
                      value={formatDate(booking.show.startTime)}
                    />

                    <InfoItem
                      icon={Clock3}
                      label="Time"
                      value={formatTime(booking.show.startTime)}
                    />

                    <InfoItem
                      icon={MapPin}
                      label="Theatre"
                      value={booking.theatre.name}
                    />

                    <InfoItem
                      icon={Film}
                      label="Screen"
                      value={`${booking.screen.name} · ${booking.show.format}`}
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-7" />

              {/* Theatre address */}
              <div className="rounded-xl border border-pink-200/70 bg-pink-50/50 p-4 dark:border-pink-900/40 dark:bg-pink-950/15">
                <div className="flex gap-3">
                  <div className="rounded-lg bg-pink-100 p-2 dark:bg-pink-900/40">
                    <MapPin className="size-5 text-pink-600 dark:text-pink-400" />
                  </div>

                  <div>
                    <p className="font-semibold">{booking.theatre.name}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.theatre.address}
                    </p>

                    <p className="mt-1 text-sm font-medium text-pink-600 dark:text-pink-400">
                      {booking.theatre.city}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-7" />

              {/* Seats */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Your Seats</h3>

                    <p className="text-sm text-muted-foreground">
                      {booking.seats.length}{" "}
                      {booking.seats.length === 1 ? "seat" : "seats"} booked
                    </p>
                  </div>

                  <Ticket className="size-5 text-pink-500" />
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
              </section>

              <Separator className="my-7" />

              {/* Payment Summary */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <ReceiptText className="size-5 text-pink-500" />

                  <h3 className="font-semibold">Payment Summary</h3>
                </div>

                <div className="space-y-3">
                  <PriceRow
                    label={`Tickets (${booking.seats.length})`}
                    value={formatCurrency(booking.amount.tickets)}
                  />

                  <PriceRow
                    label="Convenience Fee"
                    value={formatCurrency(booking.amount.convenienceFee)}
                  />

                  <PriceRow
                    label="Taxes"
                    value={formatCurrency(booking.amount.taxes)}
                  />

                  {booking.amount.discount > 0 && (
                    <PriceRow
                      label={
                        booking.offer
                          ? `Discount (${booking.offer.code})`
                          : "Discount"
                      }
                      value={`-${formatCurrency(booking.amount.discount)}`}
                      valueClassName="text-emerald-600 dark:text-emerald-400"
                    />
                  )}

                  <Separator />

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold">Total Paid</span>

                    <span className="text-xl font-bold text-pink-600 dark:text-pink-400">
                      {formatCurrency(booking.amount.total)}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT 30% */}
            <div className="border-t bg-muted/20 p-5 lg:border-l lg:border-t-0 sm:p-8 dark:bg-pink-950/5">
              {/* QR */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex items-center gap-2">
                  <QrCode className="size-5 text-pink-500" />

                  <h3 className="font-semibold">Entry Ticket</h3>
                </div>

                <div className="flex aspect-square w-full max-w-52 items-center justify-center rounded-xl border-4 border-pink-100 bg-white p-5 shadow-sm dark:border-pink-950">
                  <QrCode className="size-full text-black" />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Scan this QR code at the theatre entrance to verify your
                  booking.
                </p>
              </div>

              <Separator className="my-7" />

              {/* Booking status */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Booking Status
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-950/50">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div>
                    <p className="font-semibold">{status.label}</p>

                    <p className="text-xs text-muted-foreground">
                      Your booking is confirmed
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-7" />

              {/* Payment */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Payment
                </p>

                <div className="mt-3 space-y-3">
                  <SideDetail
                    label="Provider"
                    value={booking.payment.provider}
                  />

                  <SideDetail
                    label="Method"
                    value={booking.payment.method || "N/A"}
                  />

                  <SideDetail label="Status" value={booking.payment.status} />
                </div>
              </div>

              <Separator className="my-7" />

              {/* Booking details */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Booking Information
                </p>

                <div className="mt-3 space-y-3">
                  <SideDetail
                    label="Booked On"
                    value={formatDate(booking.createdAt)}
                  />

                  {booking.confirmedAt && (
                    <SideDetail
                      label="Confirmed"
                      value={formatDate(booking.confirmedAt)}
                    />
                  )}

                  <SideDetail
                    label="Cancellation"
                    value={
                      booking.show.cancellationAllowed
                        ? "Allowed"
                        : "Not allowed"
                    }
                  />
                </div>
              </div>

              {/* Mobile download */}
              <Button
                variant="outline"
                className="mt-7 w-full border-pink-200 hover:bg-pink-50 hover:text-pink-700 sm:hidden dark:border-pink-900 dark:hover:bg-pink-950/40"
              >
                <Download className="mr-2 size-4" />
                Download Ticket
              </Button>
            </div>
          </div>

          {/* Bottom ticket footer */}
          <div className="border-t bg-pink-50/40 px-5 py-4 text-center dark:bg-pink-950/10">
            <p className="text-xs text-muted-foreground">
              Please carry a valid ID proof along with this ticket. Booking ID{" "}
              <span className="font-medium text-foreground">
                {booking.bookingNumber}
              </span>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Small Components                                                           */
/* -------------------------------------------------------------------------- */

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-pink-500" />

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>

      <span className={cn("font-medium", valueClassName)}>{value}</span>
    </div>
  );
}

function SideDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>

      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function BookingSkeleton() {
  return (
    <main className="min-h-screen bg-linear-to-b from-pink-50/70 via-background to-background dark:from-pink-950/20">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-9 w-36 animate-pulse rounded bg-muted" />

        <Card className="overflow-hidden">
          <div className="h-20 animate-pulse bg-muted" />

          <div className="grid lg:grid-cols-[70%_30%]">
            <div className="space-y-7 p-8">
              <div className="flex gap-5">
                <div className="h-40 w-28 animate-pulse rounded-lg bg-muted" />

                <div className="flex-1 space-y-4">
                  <div className="h-7 w-64 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-16 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>

              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="h-28 animate-pulse rounded-xl bg-muted" />
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="border-t p-8 lg:border-l lg:border-t-0">
              <div className="mx-auto aspect-square max-w-52 animate-pulse rounded-xl bg-muted" />

              <div className="mt-8 h-20 animate-pulse rounded bg-muted" />
              <div className="mt-8 h-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
