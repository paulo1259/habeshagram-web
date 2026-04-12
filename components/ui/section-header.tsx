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
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-[1.4rem]">
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
