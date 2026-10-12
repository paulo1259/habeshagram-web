"use client";

import { ZemaMark } from "@/components/brand/logo";
import { useRadio } from "@/hooks/use-radio";
import { cn } from "@/lib/utils";

const RINGS = [120, 190, 260, 330, 400];

/**
 * Decorative broadcast rings for the home hero: the Zema mark at the centre,
 * concentric rings around it, and a ripple that only runs while something is
 * actually playing — so the page is quiet until the radio is on.
 */
export function SignalOrb({ className }: { className?: string }) {
  const { isPlaying } = useRadio();

  return (
    <div className={cn("relative h-[420px] w-[420px]", className)} aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(69,224,200,0.10),transparent_60%)]" />
      {RINGS.map((size, index) => (
        <span
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: size,
            height: size,
            borderColor: `rgba(${index % 2 ? "124,108,246" : "69,224,200"},${0.22 - index * 0.035})`,
            borderStyle: index === 2 ? "dashed" : "solid"
          }}
        />
      ))}
      {isPlaying
        ? [0, 1, 2].map((wave) => (
            <span
              key={wave}
              className="station-ring absolute left-1/2 top-1/2 -ml-[200px] -mt-[200px] h-[400px] w-[400px] rounded-full border border-brand-500/40"
              style={{ animationDelay: `${wave * 0.8}s`, animationDuration: "2.4s" }}
            />
          ))
        : null}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90">
        <ZemaMark size={72} live={isPlaying} />
      </div>
    </div>
  );
}
