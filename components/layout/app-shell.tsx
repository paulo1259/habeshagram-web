import type { ReactNode } from "react";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface bg-warm text-ink">
      <TopBar />
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-0 py-0 pb-20 sm:px-3 sm:py-3 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-5 lg:px-4 lg:py-4 lg:pb-8 xl:grid-cols-[232px_minmax(0,1fr)_280px]">
        <DesktopSidebar />
        <section className="min-w-0">{children}</section>
        <RightSidebar />
      </main>
      <MobileBottomNav />
    </div>
  );
}
