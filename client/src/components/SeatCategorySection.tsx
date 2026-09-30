import { Seat, SeatCategory, SeatSection } from "@/types";
import { cn } from "cn";
import { Armchair } from "lucide-react";
import { Badge } from "./ui/badge";
import React from "react";

const categoryStyles: Record<
  SeatCategory,
  {
    seat: string;
    badge: string;
  }
> = {
  NORMAL: {
    seat: "border-pink-500/50 bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 dark:text-pink-400",
    badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  EXECUTIVE: {
    seat: "border-violet-500/40 bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 dark:text-violet-400",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  PREMIUM: {
    seat: "border-sky-500/40 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
};

const getDescription: Record<SeatCategory, string> = {
  NORMAL: "Regular seats",
  EXECUTIVE: "Executive seats",
  PREMIUM: "Premium seats",
};

const formatSeatLabel = (seat: Seat): string => `${seat.row}${seat.number}`;

export default function SeatCategorySection({
  section,
  seats,
  selectedSeats,
  onSeatClick,
  lockedByOthers,
}: {
  section: SeatSection;
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seat: string) => void;
  lockedByOthers: Set<string>;
}) {
  const styles = categoryStyles[section.category];
  const rows = Array.from(new Set(seats.map((seat) => seat.row)));

  return (
    <div>
      {/* Category heading */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              styles.badge,
            )}
          >
            <Armchair className="size-4" />
          </div>

          <div>
            <h3 className="font-semibold">{section.category}</h3>
            <p className="text-xs text-muted-foreground">
              {getDescription[section.category]}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-full border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400"
        >
          ₹{section.price}
        </Badge>
      </div>

      {/* Seats */}
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-6">
        <div className="mx-auto min-w-140 max-w-3xl space-y-3">
          {rows.map((row) => {
            const rowSeats = seats.filter((seat) => seat.row === row);

            return (
              <div key={row} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
                  {row}
                </span>

                <div className="grid flex-1 grid-cols-10 gap-2">
                  {rowSeats.map((seat, index) => {
                    const selected = selectedSeats.includes(seat.id);
                    const isBooked = seat.status === "booked";
                    const isLockedByOther = lockedByOthers.has(seat.id);
                    const isUnavailable = isBooked || isLockedByOther;
                    
                    const seatLabel = formatSeatLabel(seat);
                    /*
                     * Add a small aisle after seat 5.
                     */
                    const isAisle = index === 5;

                    return (
                      <React.Fragment key={seat.id}>
                        {isAisle && (
                          <div className="pointer-events-none absolute" />
                        )}
                        <button
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => onSeatClick(seat.id)}
                          aria-label={`Seat ${seatLabel}`}
                          aria-pressed={selected}
                          className={cn(
                            "relative flex h-8 min-w-0 items-center justify-center rounded-md border text-[10px] font-medium transition-all duration-150 sm:h-9",

                            // Available
                            !isUnavailable && !selected && styles.seat,

                            // Selected
                            selected &&
                              !isUnavailable &&
                              "border-pink-600 bg-pink-600 text-white shadow-md shadow-pink-500/20 dark:border-pink-500 dark:bg-pink-500",

                            // Disabled / Booked
                            isUnavailable &&
                              "cursor-not-allowed border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500",

                            // Hover only for available seats
                            !isUnavailable && "hover:-translate-y-0.5",
                          )}
                        >
                          {seat.number}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
