import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <section className="glass-card rounded-[32px] border border-brand-100/80 p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>
    </section>
  );
}
