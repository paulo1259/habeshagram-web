import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-brand-100/70 pb-3 sm:flex-row sm:items-end sm:justify-between sm:pb-4",
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="meta-label text-brand-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="section-title mt-1">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-stone-600 sm:pr-6">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
