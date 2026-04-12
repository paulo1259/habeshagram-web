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
    return <img src={imageURL} alt={username} className={cn("h-11 w-11 rounded-full object-cover", className)} />;
  }

  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900",
        className
      )}
    >
      {getInitials(username)}
    </div>
  );
}
