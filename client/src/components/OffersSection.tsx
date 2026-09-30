import { Offer } from "@/types";
import { Check, ChevronRight, Info, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "cn";

export default function OffersSection({
  offers,
  selectedOffer,
  setSelectedOffer,
}: {
  offers: Offer[];
  selectedOffer: number | null;
  setSelectedOffer: (id: number | null) => void;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="size-4 text-pink-600 dark:text-pink-400" />
              Offers & Discounts
            </CardTitle>

            <p className="mt-1 text-xs text-muted-foreground">
              Save more on your booking
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-pink-600 hover:bg-pink-500/5 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
          >
            View all offers
            <ChevronRight className="ml-1 size-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {offers.slice(0, 2).map((offer) => {
            const selected = selectedOffer === offer.id;

            return (
              <button
                key={offer.id}
                type="button"
                onClick={() => setSelectedOffer(selected ? null : offer.id)}
                className={cn(
                  "group rounded-xl border p-3 text-left transition-all",
                  selected
                    ? "border-pink-500 bg-pink-500/5 shadow-sm"
                    : "border-border/60 hover:border-pink-500/30 hover:bg-pink-500/2",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                      <Percent className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{offer.title}</p>

                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                        {offer.description}
                      </p>
                    </div>
                  </div>

                  {selected && (
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white dark:bg-pink-500">
                      <Check className="size-3" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md border border-dashed border-pink-500/30 bg-pink-500/5 px-2 py-1 text-[10px] font-medium tracking-wide text-pink-600 dark:text-pink-400">
                    {offer.code}
                  </span>

                  <span className="text-[10px] font-medium text-pink-600 dark:text-pink-400">
                    {selected ? "Applied" : "Apply"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>Offers are subject to eligibility and applicable terms.</span>
        </div>
      </CardContent>
    </Card>
  );
}
