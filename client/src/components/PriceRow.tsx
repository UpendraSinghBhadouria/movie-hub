import { cn } from "cn";

export default function PriceRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>

      <span
        className={cn(
          "font-medium",
          negative && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {negative ? "-" : ""}₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
}
