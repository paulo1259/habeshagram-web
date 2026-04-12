import { Suspense, type ReactNode } from "react";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface bg-warm text-ink">
      <Suspense fallback={<div className="sticky top-0 z-40 h-[69px] border-b border-brand-100/80 bg-surface/90 backdrop-blur-xl" />}>
        <TopBar />
      </Suspense>
      <main className="mx-auto grid max-w-[1380px] grid-cols-1 gap-3 px-0 py-0 pb-24 sm:px-3 sm:py-3 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-5 lg:px-4 lg:py-4 lg:pb-8 xl:grid-cols-[248px_minmax(0,1fr)_308px]">
        <DesktopSidebar />
        <section className="min-w-0">{children}</section>
        <RightSidebar />
      </main>
      <MobileBottomNav />
    </div>
  );
}
