export function CommunityHighlights() {
  return (
    <section className="rounded-[28px] border border-brand-100 bg-card/96 p-5 shadow-soft">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
        Community Highlights
      </h3>
      <div className="mt-4 space-y-3">
        <div>
          <p className="font-semibold text-ink">#BunaMoments</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Morning coffee rituals, family tables, and the small things people keep returning to.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">#HabeshaStyle</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Traditional patterns, modern tailoring, and what people are wearing around the city.
          </p>
        </div>
        <div>
          <p className="font-semibold text-ink">#CommunityUpdates</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Events, celebrations, and local updates that keep the platform feeling active.
          </p>
        </div>
      </div>
    </section>
  );
}
