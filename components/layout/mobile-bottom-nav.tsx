"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, House, PenSquare, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/create", label: "Post", icon: PenSquare },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-100/80 bg-surface/94 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-[26px] border border-white/70 bg-white/78 px-1 py-1 shadow-soft">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[84px] flex-col items-center gap-1 rounded-2xl px-3 py-2.5 text-[11px] font-medium transition duration-200",
                active
                  ? "bg-gradient-to-r from-brand-100 to-orange-50 text-brand-800 shadow-sm"
                  : "text-stone-500 hover:bg-white/80 active:scale-[0.98]"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
