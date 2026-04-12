import { Skeleton } from "@/components/ui/skeleton";

export function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="aspect-square rounded-[28px]" />
      ))}
    </div>
  );
}
