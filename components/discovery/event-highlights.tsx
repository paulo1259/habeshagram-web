const events = [
  { title: "Addis Sunday Brunch Pop-Up", meta: "Bole / This Weekend" },
  { title: "Habesha Creators Meetup", meta: "Piassa / Friday Evening" },
  { title: "Live Jazz and Coffee Night", meta: "Kazanchis / Tonight" }
];

export function EventHighlights() {
  return (
    <section className="rounded-[28px] border border-brand-100 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Events
      </p>
      <h3 className="mt-1 text-lg font-black tracking-tight text-ink">Around the community</h3>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div key={event.title} className="rounded-[22px] border border-brand-100 px-4 py-3">
            <p className="font-semibold text-ink">{event.title}</p>
            <p className="mt-1 text-sm text-stone-600">{event.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
