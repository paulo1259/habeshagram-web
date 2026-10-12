import { cn } from "@/lib/utils";
import type { RadioStation } from "@/types";

/**
 * Generated cover art for a station.
 *
 * The stations have no artwork we can use, and a row of identical play
 * buttons made every station look the same. Each one gets its own pair of
 * colours from the Zema palette and its dial number (or a monogram for
 * online-only stations), drawn the same way everywhere: board, cards, player.
 */

const PALETTES: Record<string, [string, string]> = {
  "sheger-1021": ["#45e0c8", "#1d6f8f"],
  "ethio-fm-1078": ["#8b7bff", "#45e0c8"],
  "fm-addis-971": ["#38bdf8", "#6355e0"],
  "wengel-fm": ["#fb7185", "#7c6cf6"],
  "orthodox-radio": ["#f5c66b", "#c2410c"],
  "voice-of-grace-radio": ["#c4b5fd", "#2563eb"]
};

const FALLBACK: [string, string] = ["#45e0c8", "#7c6cf6"];

export function stationPalette(station: RadioStation): [string, string] {
  return PALETTES[station.id] ?? FALLBACK;
}

/** "102.1" for FM stations, initials for online ones ("Wengel FM" → "WF"). */
export function stationGlyph(station: RadioStation) {
  const dial = station.frequency.match(/\d{2,3}(?:\.\d)?/);
  if (dial) return dial[0];

  const words = station.name
    .replace(/^the\s+/i, "")
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word));
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

type Props = {
  station: RadioStation;
  size?: number;
  /** Pulses the rings — for the station that is playing right now. */
  live?: boolean;
  className?: string;
  rounded?: string;
};

export function StationArt({ station, size = 48, live = false, className, rounded }: Props) {
  const [from, to] = stationPalette(station);
  const glyph = stationGlyph(station);
  const isDial = /\d/.test(glyph);
  const fontSize = size * (isDial ? (glyph.length > 4 ? 0.27 : 0.3) : 0.36);

  return (
    <span
      className={cn("relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden", rounded ?? "rounded-[28%]", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 120% at 0% 0%, ${from} 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, ${to} 0%, transparent 60%), #0d0d18`
      }}
      aria-hidden="true"
    >
      {/* broadcast rings from the lower-right corner */}
      <span className="absolute inset-0 -z-10">
        {[0.55, 0.9, 1.25].map((scale, index) => (
          <span
            key={scale}
            className={cn("absolute rounded-full border", live && "station-ring")}
            style={{
              width: size * scale * 1.6,
              height: size * scale * 1.6,
              right: -size * scale * 0.8,
              bottom: -size * scale * 0.8,
              borderColor: `rgba(255,255,255,${0.16 - index * 0.04})`,
              animationDelay: live ? `${index * 0.45}s` : undefined
            }}
          />
        ))}
      </span>
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,7,12,0)_30%,rgba(7,7,12,0.45))]" />
      <span
        className="font-display font-bold leading-none tracking-[-0.04em] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]"
        style={{ fontSize }}
      >
        {glyph}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.12]" />
    </span>
  );
}
