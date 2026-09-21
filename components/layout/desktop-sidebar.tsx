"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Globe2, House, LogOut, Radio, UserCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/", key: "nav.home", icon: House },
  { href: "/radio", key: "nav.radio", icon: Radio },
  { href: "/world-news", key: "nav.worldNews", icon: Globe2 },
  { href: "/you", key: "nav.you", icon: UserCircle2 }
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <aside className="glass-card sticky top-24 hidden h-fit rounded-[28px] p-5 shadow-soft lg:block">
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active ? "text-brand-700" : "text-stone-500 hover:bg-white/[0.04] hover:text-ink"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl border border-brand-500/25 bg-gradient-to-r from-brand-500/15 to-orange-500/5"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="relative">{t(item.key)}</span>
              {active ? (
                <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-brand-500 shadow-glow-sm" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/[0.07] pt-5">
        {currentUser ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone-400">{t("nav.account")}</p>
            <p className="mt-2 text-sm font-semibold text-ink">@{currentUser.username}</p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.logOut")}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm leading-6 text-stone-500">
              {t("nav.sidebarPitch")}
            </p>
            <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
              {t("nav.signIn")}
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
