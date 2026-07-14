export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card rounded-[30px] border border-dashed border-brand-500/25 p-6 text-center shadow-soft sm:p-8">
      <div className="mx-auto flex h-12 w-12 animate-float-slow items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm">
        <span className="text-lg font-black">H</span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Community Space
      </p>
      <h2 className="mt-2 font-display text-lg font-bold tracking-tight text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
