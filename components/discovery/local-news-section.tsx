"use client";

import { useEffect, useState } from "react";
import { NewsCard } from "@/components/discovery/news-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getLocalNewsItems } from "@/services/news-service";
import { LocalNewsItem } from "@/types";

export function LocalNewsSection({
  compact = false
}: {
  compact?: boolean;
}) {
  const [items, setItems] = useState<LocalNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const next = await getLocalNewsItems();
      setItems(next);
      setIsLoading(false);
    })();
  }, []);

  return (
    <section
      className={
        compact
          ? "space-y-4"
          : "space-y-4 border-b border-brand-100 bg-white/96 px-3 py-4 sm:rounded-[28px] sm:border sm:px-5 sm:py-5 sm:shadow-soft"
      }
    >
      <SectionHeader
        eyebrow="Local Entertainment & Culture"
        title="Addis stories worth checking in on"
        description="Editorial culture cards for arts, music, fashion, events, and city energy, now ready for admin-managed updates."
      />

      <div className={compact ? "space-y-4" : "grid gap-4 lg:grid-cols-2"}>
        {isLoading ? (
          <div className="rounded-[24px] border border-brand-100 bg-white/70 p-4 text-sm text-stone-500">
            Loading local culture highlights...
          </div>
        ) : null}
        {!isLoading && !items.length ? (
          <EmptyState
            title="No editorial highlights yet"
            description="Culture, music, events, and community picks will appear here once the editorial collection is updated."
          />
        ) : null}
        {items.map((item) => (
          <NewsCard key={item.id} item={item} compact={compact} />
        ))}
      </div>
    </section>
  );
}
