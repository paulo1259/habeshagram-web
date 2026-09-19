"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Radio } from "lucide-react";
import { ZemaWordmark } from "@/components/brand/logo";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const iconLinkClass =
  "inline-flex rounded-xl border border-white/[0.09] bg-white/[0.03] p-2.5 text-stone-500 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:text-brand-700 active:scale-[0.96]";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/radio", label: "Radio" },
  { href: "/world-news", label: "News" }
];

export function TopBar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-surface/80 backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3 sm:gap-10 sm:px-6">
        <Link href="/" aria-label="Zema home">
          <ZemaWordmark size={30} />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  active
                    ? "bg-brand-500 font-semibold text-brand-950"
                    : "font-medium text-stone-500 hover:bg-white/[0.05] hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/radio" aria-label="Radio" className={`sm:hidden ${iconLinkClass}`}>
            <Radio className="h-4 w-4" />
          </Link>
          <Link href="/world-news" aria-label="World News" className={`sm:hidden ${iconLinkClass}`}>
            <Globe2 className="h-4 w-4" />
          </Link>

          {currentUser ? (
            <div className="hidden text-right lg:block">
              <p className="text-sm font-semibold text-ink">@{currentUser.username}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone-400">Signed in</p>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
