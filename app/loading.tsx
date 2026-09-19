import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="rounded-[28px] border border-white/[0.06] bg-card/90 p-5 shadow-soft">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-3 h-4 w-72" />
        </div>
        <div className="rounded-[28px] border border-white/[0.06] bg-card/90 p-5 shadow-soft">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    </AppShell>
  );
}
