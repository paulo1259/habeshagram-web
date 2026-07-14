import { cn, getInitials } from "@/lib/utils";

export function Avatar({
  username,
  imageURL,
  className
}: {
  username: string;
  imageURL?: string;
  className?: string;
}) {
  if (imageURL) {
    return (
      <img
        src={imageURL}
        alt={username}
        loading="lazy"
        decoding="async"
        className={cn("h-11 w-11 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-200 text-sm font-bold text-brand-800 ring-1 ring-brand-500/20",
        className
      )}
    >
      {getInitials(username)}
    </div>
  );
}
