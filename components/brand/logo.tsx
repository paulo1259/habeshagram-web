import { useId } from "react";
import { cn } from "@/lib/utils";

type MarkProps = {
  size?: number;
  className?: string;
  /** Small renders (favicon, 16–24px): drops the signal arcs, which blur together at that size. */
  compact?: boolean;
  /** Animates the signal arcs, for places that show a live station. */
  live?: boolean;
};

/**
 * Zema mark — a single-stroke Z broadcasting from its top corner.
 *
 * The Z is one continuous path, aqua into violet, so it reads as a signal
 * line rather than three separate bars. The two arcs are the broadcast; they
 * are dropped at favicon sizes, where they merged into a smudge in testing.
 * (An earlier mark swapped the diagonal for equalizer bars and read as an "I"
 * at 16px — the diagonal is what makes it a Z, so it stays.)
 *
 * The same geometry is drawn in app/icon.svg and the PNG app icons.
 */
export function ZemaMark({ size = 30, className, compact = false, live = false }: MarkProps) {
  const id = useId().replace(/:/g, "");
  const stroke = `zema-stroke-${id}`;
  const glow = `zema-ground-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={stroke} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ff2d9" />
          <stop offset="1" stopColor="#8b7bff" />
        </linearGradient>
        <radialGradient id={glow} cx="0.25" cy="0.2" r="1">
          <stop offset="0" stopColor="#16303a" />
          <stop offset="0.6" stopColor="#0c0c16" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="20" fill={`url(#${glow})`} />
      <rect x="1" y="1" width="62" height="62" rx="19" stroke="#ffffff" strokeOpacity="0.09" strokeWidth="2" />
      {compact ? (
        <path
          d="M18 19.5 H45 L18 44.5 H46"
          stroke={`url(#${stroke})`}
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path
            d="M18 20 H44 L18 44 H46"
            stroke={`url(#${stroke})`}
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M47.5 11.5 A8 8 0 0 1 52.5 16.5"
            stroke="#5ff2d9"
            strokeWidth="3"
            strokeLinecap="round"
            className={live ? "signal-arc" : undefined}
          />
          <path
            d="M48.5 4.5 A15 15 0 0 1 59.5 15.5"
            stroke="#5ff2d9"
            strokeOpacity="0.55"
            strokeWidth="3"
            strokeLinecap="round"
            className={live ? "signal-arc signal-arc-outer" : undefined}
          />
        </>
      )}
    </svg>
  );
}

export function ZemaWordmark({
  size = 30,
  textClassName,
  className,
  compact = false,
  live = false
}: MarkProps & { textClassName?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ZemaMark size={size} compact={compact} live={live} />
      <span
        className={cn(
          "font-display font-bold tracking-[-0.03em] text-ink",
          textClassName ?? "text-[21px]"
        )}
      >
        Zema
      </span>
    </span>
  );
}
