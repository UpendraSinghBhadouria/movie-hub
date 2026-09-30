import React from "react";

export default function InfoItem({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "size-4",
          },
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>

        <p className="truncate text-sm font-medium">{value}</p>

        {secondary && (
          <p className="truncate text-xs text-muted-foreground">{secondary}</p>
        )}
      </div>
    </div>
  );
}
