const topics = [
  "#BunaMoments",
  "#AddisWeekend",
  "#HabeshaStyle",
  "#GunnersAddis",
  "#ChelseaTalks",
  "#UnitedGroupChat"
];

export function TrendingTopics() {
  return (
    <section className="rounded-[28px] border border-brand-100/80 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Trending
      </p>
      <h3 className="mt-1 text-lg font-black tracking-tight text-ink">What is moving the timeline</h3>
      <div className="mt-4 space-y-3">
        {topics.map((topic, index) => (
          <div key={topic} className="rounded-[20px] bg-brand-50/60 px-4 py-3 transition hover:bg-brand-100/70">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Trending {index + 1}
            </p>
            <p className="mt-1 font-semibold text-ink">{topic}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
