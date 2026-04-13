"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, House, LogOut, PenSquare, Radio, UserCircle2 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/create", label: "Create Post", icon: PenSquare },
  { href: "/match/live", label: "Live Match Center", icon: Radio },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, authMode } = useAppData();

  return (
    <aside className="glass-card sticky top-24 hidden h-fit rounded-[32px] border border-brand-100/80 p-5 shadow-soft lg:block">
      <p className="text-2xl font-black tracking-tight text-ink">HabeshaGram</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        A brighter Habesha timeline for food, fashion, music, memes, football takes, and city culture.
      </p>

      <nav className="mt-6 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-gradient-to-r from-brand-100 to-orange-50 text-brand-800 shadow-sm"
                  : "text-stone-600 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-ink"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-brand-50 via-white to-orange-50 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          Your Corner
        </p>
        <p className="mt-2 text-sm font-semibold text-ink">
          {currentUser ? `@${currentUser.username}` : "Browse first"}
        </p>
        <p className="mt-1 text-sm text-stone-600">
          {currentUser ? currentUser.bio : "Log in to post, like, and comment."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
          <span className="rounded-full bg-white px-3 py-1">
            {authMode === "firebase" ? "Firebase auth" : "Setup needed"}
          </span>
          <span className="rounded-full bg-white px-3 py-1">Saved posts</span>
          <span className="rounded-full bg-white px-3 py-1">Fan zone</span>
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
