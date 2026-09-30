import { events } from "@/constants";
import { EventCard } from "@/components/EventCard";

export function LiveEvents() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            The Best of Live Events
          </h2>
        </div>

        {/* Events */}
        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            sm:gap-4
            lg:grid-cols-5
          "
        >
          {events.slice(0, 5).map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
