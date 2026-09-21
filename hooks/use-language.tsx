"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, parseLang, type Lang } from "@/lib/i18n/config";
import { translate, type MessageKey } from "@/lib/i18n/messages";

type Vars = Record<string, string | number>;

type LanguageValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
};

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  // Pages prerendered at build time (the station pages) are rendered without
  // a cookie, so they arrive in English. Correct to the saved choice here.
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]+)`));
    const saved = parseLang(match?.[1]);
    if (saved !== initialLang) {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, [initialLang]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = next;
      // Re-render server parts (page titles, <html lang>) in the new language.
      router.refresh();
    },
    [router]
  );

  const value = useMemo<LanguageValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
