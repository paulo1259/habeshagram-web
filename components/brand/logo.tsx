import { cn } from "@/lib/utils";

type MarkProps = {
  size?: number;
  className?: string;
  /** Thickens the strokes for very small renders (favicon, 16–24px). */
  compact?: boolean;
};

/**
 * Zema mark — a geometric Z in a rounded tile.
 *
 * An earlier version replaced the diagonal with equalizer bars. It tested
 * badly: at 16 and 32px the bars merged into a centre stem and the whole mark
 * read as a capital I. The diagonal is what makes it a Z, so it stays.
 */
export function ZemaMark({ size = 30, className, compact = false }: MarkProps) {
  const bar = compact ? 7 : 6.5;

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
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="18"
        fill="#0e0e17"
        stroke="#45e0c8"
        strokeWidth={compact ? 3 : 2}
      />
      <rect x="17" y="15" width="30" height={bar} rx={bar / 2} fill="#45e0c8" />
      <path
        d="M43.5 22 L20.5 42"
        stroke="#45e0c8"
        strokeWidth={compact ? 7 : 6.5}
        strokeLinecap="round"
      />
      <rect x="17" y={49 - bar} width="30" height={bar} rx={bar / 2} fill="#45e0c8" />
    </svg>
  );
}

export function ZemaWordmark({
  size = 30,
  textClassName,
  className,
  compact = false
}: MarkProps & { textClassName?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ZemaMark size={size} compact={compact} />
      <span
        className={cn(
          "font-display font-bold tracking-[-0.02em] text-ink",
          textClassName ?? "text-[21px]"
        )}
      >
        Zema
      </span>
    </span>
  );
}
