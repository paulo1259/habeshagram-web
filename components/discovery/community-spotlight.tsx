export function CommunitySpotlight() {
  return (
    <section className="rounded-[28px] border border-brand-100 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Spotlight
      </p>
      <h3 className="mt-1 text-lg font-black tracking-tight text-ink">Featured Habesha creators</h3>
      <div className="mt-4 rounded-[22px] bg-gradient-to-br from-brand-50 to-white p-4">
        <p className="font-semibold text-ink">@addis.frames</p>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Sharing neighborhood photography, cafe corners, and the city textures people miss when they rush.
        </p>
      </div>
    </section>
  );
}
