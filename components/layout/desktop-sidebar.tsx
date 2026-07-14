"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bookmark, Clapperboard, Globe2, House, LogOut, Mic2, PenSquare, UserCircle2 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/world-news", label: "World News", icon: Globe2 },
  { href: "/radio", label: "Radio", icon: Mic2 },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/create", label: "Create Post", icon: PenSquare },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, authMode } = useAppData();

  return (
    <aside className="glass-card sticky top-24 hidden h-fit rounded-[32px] p-5 shadow-soft lg:block">
      <p className="font-display text-2xl font-bold tracking-tight">
        <span className="text-gold">Habesha</span>
        <span className="text-ink">Gram</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        A brighter Habesha timeline for food, fashion, music, East Africa news, and city culture.
      </p>

      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "text-brand-700"
                  : "text-stone-500 hover:bg-white/[0.04] hover:text-ink"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl border border-brand-500/25 bg-gradient-to-r from-brand-500/15 to-orange-500/5 shadow-glow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon
                className={cn(
                  "relative h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                  active && "drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                )}
              />
              <span className="relative">{item.label}</span>
              {active ? (
                <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-brand-500 shadow-glow-sm" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="card-lux mt-6 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          Your Corner
        </p>
        <p className="mt-2 text-sm font-semibold text-ink">
          {currentUser ? `@${currentUser.username}` : "Browse first"}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {currentUser ? currentUser.bio : "Log in to post, like, and comment."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-1">
            {authMode === "firebase" ? "Firebase auth" : "Setup needed"}
          </span>
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-1">Saved posts</span>
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-3 py-1">East Africa news</span>
        </div>
      </div>

      {currentUser ? (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      ) : (
        <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
          Log in
        </Button>
      )}
    </aside>
  );
}
