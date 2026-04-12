import { Radio } from "lucide-react";

const upcomingStations = [
  {
    name: "Ethio FM 107.8",
    description: "Entertainment, news, and sports"
  },
  {
    name: "FM Addis 97.1",
    description: "More Addis stations soon"
  }
];

export function RadioComingSoon() {
  return (
    <section className="rounded-[28px] border border-brand-100 bg-white/96 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            More Live Radio Soon
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-ink">
            Addis stations coming soon
          </h3>
        </div>
        <div className="rounded-full bg-brand-50 p-2 text-brand-700">
          <Radio className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {upcomingStations.map((station) => (
          <div
            key={station.name}
            className="rounded-[22px] border border-dashed border-brand-200 bg-brand-50/50 p-4"
          >
            <p className="font-semibold text-ink">{station.name}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{station.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
