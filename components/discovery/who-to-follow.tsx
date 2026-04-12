const creators = [
  { name: "@selam.addis", note: "Coffee, style, and city culture" },
  { name: "@asmara.vibes", note: "Food stories and community moments" },
  { name: "@habesha.events", note: "Weekend plans and local happenings" }
];

export function WhoToFollow() {
  return (
    <section className="rounded-[28px] border border-brand-100 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Who To Follow
      </p>
      <h3 className="mt-1 text-lg font-black tracking-tight text-ink">People worth checking in on</h3>
      <div className="mt-4 space-y-3">
        {creators.map((creator) => (
          <div
            key={creator.name}
            className="flex items-center justify-between gap-3 rounded-[22px] border border-brand-100 bg-brand-50/40 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-ink">{creator.name}</p>
              <p className="mt-1 text-sm text-stone-600">{creator.note}</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-800 shadow-sm transition hover:bg-brand-100"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
