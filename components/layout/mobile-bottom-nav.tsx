"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Globe2, House, Radio, UserCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", key: "nav.home", icon: House },
  { href: "/radio", key: "nav.radio", icon: Radio },
  { href: "/world-news", key: "nav.news", icon: Globe2 },
  { href: "/you", key: "nav.you", icon: UserCircle2 }
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-[22px] border border-white/[0.09] bg-card/92 px-2 py-1.5 shadow-soft backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[52px] min-w-[62px] flex-col items-center justify-center gap-1 rounded-[14px] px-3 text-[10.5px] font-semibold transition",
                active ? "text-brand-950" : "text-stone-500 active:scale-[0.95]"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="bottomnav-active"
                  className="absolute inset-0 rounded-[14px] bg-brand-500"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="relative h-[19px] w-[19px]" />
              <span className="relative">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
