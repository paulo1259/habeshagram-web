"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { RadioPlayer } from "@/components/discovery/radio-player";
import { RadioStationCard } from "@/components/discovery/radio-station-card";
import { radioStations } from "@/services/discovery-data";

export function RadioCarousel() {
  const initialStation = useMemo(
    () =>
      radioStations.find((station) => station.embedUrl) ??
      radioStations.find((station) => station.streamUrl) ??
      radioStations[0] ??
      null,
    []
  );
  const [selectedStation, setSelectedStation] = useState(initialStation);

  return (
    <section className="space-y-4 border-b border-brand-100 bg-white/96 px-3 py-4 sm:rounded-[28px] sm:border sm:px-5 sm:py-5 sm:shadow-soft">
      <SectionHeader
        eyebrow="Live Addis Radio"
        title="Tune into city voices and culture"
        description="Choose a station to load it into the HabeshaGram player. Verified Zeno widgets play directly inside the site."
      />

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-start lg:gap-5 lg:space-y-0">
        <div className="space-y-4">
          <RadioPlayer station={selectedStation} className="lg:hidden" />

          <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 pt-1 sm:hidden no-scrollbar">
            {radioStations.map((station) => (
              <div key={station.id} className="snap-start first:pl-0 last:pr-3">
                <RadioStationCard
                  station={station}
                  compact
                  isSelected={selectedStation?.id === station.id}
                  onSelect={setSelectedStation}
                />
              </div>
            ))}
          </div>

          <div className="hidden gap-4 md:grid md:grid-cols-2">
            {radioStations.map((station) => (
              <RadioStationCard
                key={station.id}
                station={station}
                isSelected={selectedStation?.id === station.id}
                onSelect={setSelectedStation}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <RadioPlayer station={selectedStation} />
        </div>
      </div>
    </section>
  );
}
