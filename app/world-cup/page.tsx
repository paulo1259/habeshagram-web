import { Globe2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { worldCupPromo } from "@/services/mma-hub-data";

export default function WorldCupPage() {
  return (
    <AppShell>
      <div className="page-stack">
        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="World Cup"
            title={worldCupPromo.title}
            description="A temporary tournament architecture that can be promoted from Home, then retired cleanly after the event."
          />

          <div className="mt-4 rounded-[28px] border border-brand-100/80 bg-gradient-to-r from-white via-brand-50/70 to-orange-50/80 p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-brand-50 p-3 text-brand-800">
                <Globe2 className="h-5 w-5" />
              </div>
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                  {worldCupPromo.statusLabel}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">{worldCupPromo.subtitle}</h1>
                <p className="mt-3 text-sm leading-6 text-stone-600">{worldCupPromo.body}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
