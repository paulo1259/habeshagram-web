"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Clapperboard, Film, Flag, LayoutGrid, Newspaper, ShieldCheck, Sparkles } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { verifyAdminSession } from "@/services/admin-content-service";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/videos", label: "Curated Videos", icon: Film },
  { href: "/admin/shorts", label: "Curated Shorts", icon: Clapperboard },
  { href: "/admin/debates", label: "Daily Debates", icon: Sparkles },
  { href: "/admin/editorial", label: "Editorial Highlights", icon: Newspaper },
  { href: "/admin/reports", label: "Reports", icon: Flag }
];

export function AdminLayout({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, isReady, authMode } = useAuth();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");
  const [message, setMessage] = useState("Checking your admin access...");

  useEffect(() => {
    if (!isReady) {
      setStatus("checking");
      setMessage("Checking your session...");
      return;
    }

    if (!currentUser) {
      setStatus("checking");
      setMessage(
        authMode === "unconfigured"
          ? "Firebase auth is not configured yet."
          : "Redirecting to login..."
      );
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        await verifyAdminSession();

        if (!isMounted) {
          return;
        }

        setStatus("allowed");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("denied");
        setMessage(
          error instanceof Error
            ? error.message
            : "Admin access is not available right now."
        );
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authMode, currentUser, isReady]);

  return (
    <AppShell>
      <AuthGuard>
        {status === "checking" ? (
          <section className="rounded-[30px] border border-brand-100 bg-white/96 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Admin
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-ink">
              Loading the content workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
          </section>
        ) : status === "denied" ? (
          <EmptyState title="Admin access is locked" description={message} />
        ) : (
          <div className="space-y-5">
            <section className="rounded-[32px] border border-brand-100 bg-white/96 p-5 shadow-soft sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin Workspace
                  </div>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">{title}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
                </div>

                <div className="rounded-[24px] bg-gradient-to-br from-brand-50 via-white to-orange-50 px-4 py-3 text-sm text-stone-600 shadow-sm">
                  Public reads stay open. Admin edits stay server-side.
                </div>
              </div>

              <nav className="mt-5 flex flex-wrap gap-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                        active
                          ? "bg-brand-600 text-white shadow-soft"
                          : "border border-brand-100 bg-white text-stone-600 hover:-translate-y-0.5 hover:border-brand-200 hover:text-ink"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </section>

            {children}
          </div>
        )}
      </AuthGuard>
    </AppShell>
  );
}
