export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-200 bg-white/90 p-8 text-center shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Community Space
      </p>
      <h2 className="mt-2 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
    </div>
  );
}
