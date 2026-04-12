"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, PenSquare, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/create", label: "Post", icon: PenSquare },
  { href: "/profile", label: "Profile", icon: UserCircle2 }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-100/80 bg-surface/96 px-2 py-2 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[78px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition",
                active ? "bg-brand-100 text-brand-800 shadow-sm" : "text-stone-500 hover:bg-white/80"
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
