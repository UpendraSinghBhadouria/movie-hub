"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Ticket,
  User,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import InfoItem from "./InfoItem";
import OffersSection from "./OffersSection";
import PriceRow from "./PriceRow";
import { ShowSeatResponse, TicketSummary } from "@/types";
import { offers } from "@/constants";
import { PayButton } from "./PayButton";
import { getLockId } from "@/lib/seatLock";
import { useSeatContext } from "@/hooks/useSeatContext";
import { useMemo, useState } from "react";
import { formatDate, formatTime, getMoviePoster } from "@/utils";
import { useAuth } from "@/hooks/useAuth";

type CheckoutClientProps = {
  data: ShowSeatResponse | null;
};

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export default function CheckoutClient({ data }: CheckoutClientProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);

  const { selectedSeats } = useSeatContext();
  const { currentUser } = useAuth();
  const tickets = useMemo<TicketSummary[]>(() => {
    if (!data?.seats || selectedSeats.length === 0) {
      return [];
    }

    const selectedSeatData = data.seats.filter((seat) =>
      selectedSeats.includes(seat.id),
    );

    const grouped = new Map<string, TicketSummary>();

    for (const seat of selectedSeatData) {
      const key = seat.category.toUpperCase();

      const existing = grouped.get(key);

      const seatLabel = `${seat.row}${seat.number}`;

      if (existing) {
        existing.quantity += 1;
        existing.seats.push(seatLabel);
        continue;
      }

      grouped.set(key, {
        category: key,
        label: formatCategory(seat.category),
        price: Number(seat.price),
        quantity: 1,
        seats: [seatLabel],
      });
    }

    return Array.from(grouped.values());
  }, [data?.seats, selectedSeats]);

  /*
   * Ticket amount comes from the actual ShowSeat prices.
   */
  const ticketAmount = useMemo(
    () =>
      tickets.reduce(
        (total, ticket) => total + ticket.price * ticket.quantity,
        0,
      ),
    [tickets],
  );

  /*
   * TODO:
   * Replace these with your actual backend pricing rules
   * when the payment/booking API is implemented.
   */
  const convenienceFee = 0;

  const taxes = 0;

  const discount = 0;

  const subtotal = ticketAmount + convenienceFee + taxes;

  const total = Math.max(0, subtotal - discount);

  const movie = data?.movie;
  const theatre = data?.theatre;
  const screen = data?.screen;
  const show = data?.show;
  const languages = ["Hindi", "English"];
  const genres = ["Drama", "Action"];
  /*
   * Loading state
   */
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-background pb-12">
  //       <header className="border-b border-border/60">
  //         <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
  //           <div className="flex items-center gap-3">
  //             <div className="size-9 animate-pulse rounded-full bg-muted" />

  //             <div>
  //               <div className="h-3 w-20 animate-pulse rounded bg-muted" />

  //               <div className="mt-2 h-6 w-56 animate-pulse rounded bg-muted" />
  //             </div>
  //           </div>
  //         </div>
  //       </header>

  //       <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  //         <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
  //           <div className="space-y-5">
  //             <div className="h-80 animate-pulse rounded-xl bg-muted" />
  //             <div className="h-48 animate-pulse rounded-xl bg-muted" />
  //             <div className="h-32 animate-pulse rounded-xl bg-muted" />
  //           </div>

  //           <div className="h-150 animate-pulse rounded-xl bg-muted" />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  /*
   * Error / invalid show
   */
  if (!data || !show || !movie || !theatre || !screen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold">Unable to load checkout</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              We could not load the show or seat information.
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

  /*
   * No seats in context.
   */
  if (selectedSeats.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold">No seats selected</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Please select at least one seat before continuing to checkout.
            </p>

            <Button
              className="mt-5 rounded-xl"
              onClick={() => window.history.back()}
            >
              Select Seats
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="size-5" />
            </Button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-pink-600 dark:text-pink-400">
                Checkout
              </p>

              <h1 className="text-xl font-bold sm:text-2xl">
                Review Your Booking
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)] lg:items-start">
          {/* ========================================================= */}
          {/* LEFT - BOOKING DETAILS */}
          {/* ========================================================= */}

          <section className="min-w-0 space-y-5">
            {/* Movie */}
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Poster */}
                  <div className="relative h-56 w-full shrink-0 overflow-hidden bg-muted sm:h-auto sm:w-36 lg:w-40">
                    {movie.posterUrl && (
                      <img
                        src={getMoviePoster(movie.posterUrl)}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                      />
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                  </div>

                  {/* Movie info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {movie.certificate && (
                          <Badge
                            variant="outline"
                            className="border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400"
                          >
                            {movie.certificate}
                          </Badge>
                        )}

                        {languages.length > 0 && (
                          <Badge variant="secondary" className="font-normal">
                            {languages.join(", ")}
                          </Badge>
                        )}

                        {genres.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {genres.join(", ")}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-xl font-bold">{movie.title}</h2>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <InfoItem
                        icon={<MapPin />}
                        label="Theatre"
                        value={theatre.name}
                        secondary={theatre.address}
                      />

                      <InfoItem
                        icon={<CalendarDays />}
                        label="Date & Time"
                        value={formatDate(show.startTime)}
                        secondary={formatTime(show.startTime)}
                      />

                      <InfoItem
                        icon={<Ticket />}
                        label="Screen"
                        value={screen.name}
                      />

                      <InfoItem
                        icon={<Clock3 />}
                        label="Show"
                        value={formatTime(show.startTime)}
                        secondary={`${show.format ?? "2D"} • ${theatre.city}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket details */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Ticket Details</CardTitle>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Your selected seats and ticket category
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400"
                  >
                    {selectedSeats.length}{" "}
                    {selectedSeats.length === 1 ? "Ticket" : "Tickets"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.category}
                      className="rounded-xl border border-border/60 bg-muted/20 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {ticket.label}
                            </span>

                            <Badge
                              variant="secondary"
                              className="rounded-full text-[10px]"
                            >
                              {ticket.quantity}{" "}
                              {ticket.quantity === 1 ? "Ticket" : "Tickets"}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Seats:{" "}
                            <span className="font-medium text-foreground">
                              {ticket.seats.join(", ")}
                            </span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs text-muted-foreground">
                            ₹{ticket.price} × {ticket.quantity}
                          </p>

                          <p className="font-semibold">
                            ₹
                            {(ticket.price * ticket.quantity).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cancellation policy */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      show.cancellationAllowed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                    )}
                  >
                    {show.cancellationAllowed ? (
                      <Check className="size-4" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Cancellation Policy
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {show.cancellationAllowed
                        ? "Cancellation is allowed for this show."
                        : "Cancellation is not available for this show."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offers */}
            <OffersSection
              offers={offers}
              selectedOffer={selectedOffer}
              setSelectedOffer={setSelectedOffer}
            />
          </section>

          {/* ========================================================= */}
          {/* RIGHT - PAYMENT SUMMARY */}
          {/* ========================================================= */}

          <aside className="lg:sticky lg:top-6">
            <Card className="overflow-hidden border-border/60 shadow-md">
              {/* Pink top accent */}
              <div className="h-1 bg-linear-to-r from-pink-500 via-fuchsia-500 to-pink-400" />

              <CardHeader className="pb-4">
                <CardTitle className="text-base">Payment Summary</CardTitle>

                <p className="text-xs text-muted-foreground">
                  Review your payment details before proceeding
                </p>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Price breakdown */}
                <div className="space-y-3">
                  <PriceRow label="Ticket price" value={ticketAmount} />

                  <PriceRow label="Convenience fee" value={convenienceFee} />

                  <PriceRow label="Taxes & GST" value={taxes} />

                  <PriceRow label="Discount" value={discount} negative />
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium">Amount to pay</p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Inclusive of all applicable taxes
                    </p>
                  </div>

                  <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                    ₹{total.toLocaleString("en-IN")}
                  </p>
                </div>

                <Separator />

                {/* Customer details */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                      <User className="size-4" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">Your Details</p>

                      <p className="text-[11px] text-muted-foreground">
                        Ticket confirmation will be sent here
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400">
                        <User className="size-4" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {currentUser?.email}
                        </p>

                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          {currentUser?.mobile ?? "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure payment */}
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="size-4 shrink-0" />

                  <span>Your payment information is secure and encrypted.</span>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(value) =>
                      setTermsAccepted(value === true)
                    }
                    className="mt-0.5 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600 dark:data-[state=checked]:border-pink-500 dark:data-[state=checked]:bg-pink-500"
                  />

                  <label
                    htmlFor="terms"
                    className="cursor-pointer text-xs leading-5 text-muted-foreground"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      className="font-medium text-pink-600 hover:underline dark:text-pink-400"
                    >
                      Terms & Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="font-medium text-pink-600 hover:underline dark:text-pink-400"
                    >
                      Privacy Policy
                    </button>
                    .
                  </label>
                </div>

                {/* Proceed */}
                {/* <Button
                  disabled={!termsAccepted}
                  className="h-12 w-full rounded-xl bg-pink-600 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
                >
                  Proceed to Pay
                  <ChevronRight className="ml-1 size-4" />
                </Button> */}

                <PayButton
                  termsAccepted={termsAccepted}
                  showId={show.id}
                  lockId={getLockId()}
                  seatIds={selectedSeats}
                  amount={total}
                />
                <p className="text-center text-[10px] text-muted-foreground">
                  You will be redirected to a secure payment gateway
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
