import Image, { type StaticImageData } from "next/image";

export type Event = {
  title: string;
  subtitle: string;
  img: StaticImageData;
};

type EventCardProps = {
  event: Event;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <Image
          src={event.img}
          alt={event.title}
          width={500}
          height={375}
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 20vw"
          className=" h-auto w-full object-contain transition-transform duration-300 group-hover:scale-105 "
        />
      </div>
    </article>
  );
}
