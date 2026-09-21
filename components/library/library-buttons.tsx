"use client";

import { Bookmark, Heart } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { cn } from "@/lib/utils";
import type { SavedStory } from "@/services/library-service";
import type { RadioStation, WorldNewsItem } from "@/types";

/**
 * Heart a station. Signed out, the tap goes to sign-in and comes straight
 * back here — the button is the pitch for having an account.
 */
export function FavoriteButton({
  station,
  size = "md",
  className
}: {
  station: RadioStation;
  size?: "sm" | "md";
  className?: string;
}) {
  const { isFavorite, toggleFavorite, isSignedIn } = useLibrary();
  const active = isFavorite(station.id);
  const label = active
    ? `Remove ${station.name} from your stations`
    : isSignedIn
      ? `Add ${station.name} to your stations`
      : `Sign in to save ${station.name}`;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(station);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center justify-center rounded-2xl transition active:scale-[0.92]",
        size === "sm" ? "h-11 w-11" : "h-11 w-11 border border-white/[0.1]",
        active ? "text-orange-700" : "text-stone-400 hover:text-ink",
        className
      )}
    >
      <Heart className={cn("h-[18px] w-[18px] transition", active && "scale-110 fill-current")} />
    </button>
  );
}

export function SaveStoryButton({
  item,
  className
}: {
  item: WorldNewsItem | SavedStory;
  className?: string;
}) {
  const { isSaved, toggleSaved, isSignedIn } = useLibrary();
  const active = isSaved(item.id);
  const label = active ? "Remove from saved stories" : isSignedIn ? "Save story for later" : "Sign in to save stories";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSaved(item);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-[0.92]",
        active ? "text-brand-700" : "text-stone-400 hover:bg-white/[0.05] hover:text-ink",
        className
      )}
    >
      <Bookmark className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
}
