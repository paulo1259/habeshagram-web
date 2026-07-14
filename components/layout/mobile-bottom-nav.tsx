"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Clapperboard, Globe2, House, Mic2, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/world-news", label: "News", icon: Globe2 },
  { href: "/radio", label: "Radio", icon: Mic2 },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 lg:hidden">
      <div className="glass-card mx-auto flex max-w-md items-center justify-around rounded-[26px] px-1 py-1 shadow-soft">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2.5 text-[11px] font-medium transition duration-200",
                active ? "text-brand-700" : "text-stone-500 active:scale-[0.95]"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="bottomnav-active"
                  className="absolute inset-0 rounded-2xl border border-brand-500/25 bg-gradient-to-b from-brand-500/15 to-transparent"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon
                className={cn(
                  "relative h-5 w-5",
                  active && "drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                )}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
