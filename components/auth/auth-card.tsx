"use client";

import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";
import { ZemaMark } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { cn } from "@/lib/utils";

/** The frame shared by sign-in, sign-up and password reset. */
export function AuthCard({
  eyebrow,
  title,
  body,
  children,
  footer
}: {
  eyebrow: string;
  title: string;
  body?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-surface px-4 py-8 sm:py-14">
      <div className="pointer-events-none absolute -left-32 -top-40 h-[460px] w-[460px] rounded-full bg-brand-500/[0.12] blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-orange-500/[0.12] blur-[100px]" />

      <div className="relative mx-auto flex max-w-md items-center justify-between">
        <Link href="/" aria-label="Zema" className="inline-flex items-center gap-2.5">
          <ZemaMark size={34} />
          <span className="font-display text-xl font-bold tracking-[-0.02em] text-ink">Zema</span>
        </Link>
        <LanguageToggle />
      </div>

      <section className="relative mx-auto mt-8 max-w-md rounded-[28px] border border-white/[0.09] bg-card/90 p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
        {body ? <p className="mt-2 text-[14.5px] leading-6 text-stone-500">{body}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 text-sm">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-stone-400 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/25",
        props.className
      )}
    />
  );
}

export function AuthSubmit({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="btn-glow inline-flex min-h-12 w-full items-center justify-center rounded-[14px] px-6 text-[15px] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-6",
        tone === "error"
          ? "border border-red-500/25 bg-red-500/[0.08] text-red-700"
          : "border border-brand-500/30 bg-brand-500/[0.08] text-brand-700"
      )}
    >
      {children}
    </p>
  );
}

export const authLinkClass = "font-semibold text-brand-700 transition hover:text-ink";
