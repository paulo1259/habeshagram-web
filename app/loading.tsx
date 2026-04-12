import { AppShell } from "@/components/layout/app-shell";
import { FeedSkeleton } from "@/components/posts/feed-skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="rounded-[28px] border border-brand-100 bg-white/90 p-5 shadow-soft">
          <p className="text-sm text-stone-500">Loading HabeshaGram...</p>
        </div>
        <FeedSkeleton />
      </div>
    </AppShell>
  );
}
