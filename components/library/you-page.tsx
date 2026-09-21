"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, History, LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SaveStoryButton } from "@/components/library/library-buttons";
import { StationCard } from "@/components/radio/radio-page";
import { useAuth } from "@/hooks/use-auth";
import { useLibrary } from "@/hooks/use-library";
import { useLanguage } from "@/hooks/use-language";
import { formatRelativeTime } from "@/lib/utils";
import { loginHref } from "@/lib/safe-next";

const PERKS = [
  { icon: Heart, title: "you.perk1Title", text: "you.perk1Body" },
  { icon: History, title: "you.perk2Title", text: "you.perk2Body" },
  { icon: Bookmark, title: "you.perk3Title", text: "you.perk3Body" }
] as const;

function SignedOut() {
  const { t } = useLanguage();
  return (
    <section className="border-b border-white/[0.06] bg-card/90 px-4 py-8 sm:rounded-[30px] sm:border sm:px-8 sm:py-10">
      <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[2.4rem]">
        {t("you.pitchTitle")}
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-7 text-stone-500">
        {t("you.pitchBody")}
      </p>

      <ul className="mt-7 grid gap-3 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-5">
            <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
            <p className="mt-3 font-semibold text-ink">{t(title)}</p>
            <p className="mt-1.5 text-[13px] leading-5 text-stone-500">{t(text)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/signup?next=%2Fyou" className="btn-glow inline-flex items-center rounded-[14px] px-6 py-3.5 text-[15px]">
          {t("you.createAccount")}
        </Link>
        <Link
          href={loginHref("/you")}
          className="inline-flex items-center rounded-[14px] border border-white/[0.12] px-6 py-3.5 text-[15px] font-medium text-ink transition hover:border-brand-500/35"
        >
          {t("nav.signIn")}
        </Link>
      </div>
    </section>
  );
}

export function YouPage() {
  const { currentUser, isReady, logout } = useAuth();
  const { favoriteStations, savedStories } = useLibrary();
  const router = useRouter();
  const { t } = useLanguage();

  if (!isReady) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-[30px] bg-white/[0.03]" />
      </AppShell>
    );
  }

  if (!currentUser) {
    return (
      <AppShell>
        <SignedOut />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-4 px-4 pt-4 sm:px-0 sm:pt-0">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{t("you.eyebrow")}</p>
            <h1 className="mt-2 font-display text-[2rem] font-bold tracking-[-0.03em] text-ink">@{currentUser.username}</h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold text-stone-500 ring-1 ring-white/[0.1] transition hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("nav.logOut")}
          </button>
        </section>

        <section className="px-4 sm:px-0">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">{t("you.stations")}</h2>
          {favoriteStations.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {favoriteStations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-[20px] border border-dashed border-white/[0.1] p-5 text-sm text-stone-500">
              {t("you.stationsEmptyBefore")}{" "}
              <Link href="/radio" className="font-semibold text-brand-700 hover:text-ink">
                {t("you.stationsEmptyLink")}
              </Link>{" "}
              <Heart className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> {t("you.stationsEmptyAfter")}
            </p>
          )}
        </section>

        <section className="px-4 pb-4 sm:px-0">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">{t("you.saved")}</h2>
          {savedStories.length ? (
            <ul className="mt-3 divide-y divide-white/[0.06] rounded-[20px] border border-white/[0.08] bg-white/[0.02]">
              {savedStories.map((story) => (
                <li key={story.id} className="flex items-start gap-3 p-4">
                  <a href={story.link} target="_blank" rel="noreferrer" className="group min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-ink transition group-hover:text-brand-700">
                      {story.headline}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-stone-400">
                      {story.source} · {t("you.savedAgo", { when: formatRelativeTime(story.savedAt) })}
                    </p>
                  </a>
                  <SaveStoryButton item={story} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-[20px] border border-dashed border-white/[0.1] p-5 text-sm text-stone-500">
              {t("you.savedEmptyBefore")}{" "}
              <Link href="/world-news" className="font-semibold text-brand-700 hover:text-ink">
                {t("you.savedEmptyLink")}
              </Link>{" "}
              <Bookmark className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> {t("you.savedEmptyAfter")}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
