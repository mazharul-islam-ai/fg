import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Slot-based empty state â compose icon / copy / CTA via children props */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center shadow-soft",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-1.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
