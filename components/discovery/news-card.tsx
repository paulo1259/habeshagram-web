"use client";

import { ArrowUpRight } from "lucide-react";
import { LocalNewsItem } from "@/types";
import { Button } from "@/components/ui/button";

export function NewsCard({
  item,
  compact = false
}: {
  item: LocalNewsItem;
  compact?: boolean;
}) {
  return (
    <article
      className={`overflow-hidden border border-brand-100 bg-white/98 shadow-soft transition ${
        compact ? "rounded-[24px]" : "rounded-[28px] hover:-translate-y-0.5 hover:shadow-lg"
      }`}
    >
      {item.imageURL ? (
        <div className="relative overflow-hidden">
          <img
            src={item.imageURL}
            alt={item.headline}
            className={compact ? "h-36 w-full object-cover" : "h-48 w-full object-cover"}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="flex h-40 items-end bg-gradient-to-br from-brand-50 via-white to-brand-100/60 p-5">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800 shadow-sm">
            {item.category}
          </span>
        </div>
      )}
      <div className={compact ? "p-4" : "p-5"}>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
            {item.category}
          </span>
          <p className="text-xs font-medium text-stone-500">{item.source}</p>
        </div>
        <h3 className="mt-3 text-[1.05rem] font-bold leading-6 tracking-tight text-ink">
          {item.headline}
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">{item.summary}</p>
        <div className="mt-4 border-t border-brand-100/80 pt-3">
          <Button
            variant="ghost"
            className="min-h-10 px-0 text-brand-800 hover:bg-transparent hover:text-brand-900"
            onClick={() => {
              if (item.link) {
                window.open(item.link, "_blank", "noopener,noreferrer");
              }
            }}
          >
            Read more
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
