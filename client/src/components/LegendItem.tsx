import { cn } from "cn";

export default function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-4 rounded border", className)} />
      <span>{label}</span>
    </div>
  );
}
