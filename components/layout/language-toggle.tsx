"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

/** One tap between English and Amharic. The label is always in the *other* language. */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  const next = lang === "am" ? "en" : "am";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t("nav.switchToLabel")}
      title={t("nav.switchToLabel")}
      lang={next}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px] font-semibold text-stone-500 transition hover:border-brand-500/40 hover:text-ink active:scale-[0.96]",
        className
      )}
    >
      <Languages className="h-4 w-4" />
      <span className={next === "am" ? "font-ethiopic" : undefined}>{t("nav.switchTo")}</span>
    </button>
  );
}
