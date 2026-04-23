"use client";

import Link from "next/link";
import { Film, Flag, Newspaper, Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";

const cards = [
  {
    href: "/admin/videos",
    title: "Curated Videos",
    description:
      "Add, update, and remove the embedded video highlights powering the homepage and video detail pages.",
    icon: Film
  },
  {
    href: "/admin/debates",
    title: "Daily Debates",
    description:
      "Manage the rotating debate prompts that deep-link into prefilled posting and topic flows.",
    icon: Sparkles
  },
  {
    href: "/admin/editorial",
    title: "Editorial Highlights",
    description:
      "Publish local culture, music, and community cards without touching Firestore by hand.",
    icon: Newspaper
  },
  {
    href: "/admin/reports",
    title: "Moderation Reports",
    description:
      "Review community-submitted reports privately and move each case through simple admin statuses.",
    icon: Flag
  }
];

export function AdminHomePage() {
  return (
    <AdminLayout
      title="Admin Content Workspace"
      description="This is the lightweight control room for HabeshaGram’s curated content. It stays intentionally small: one admin, three collections, and direct writes into the live Firestore-backed discovery surfaces."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[30px] border border-brand-100 bg-white/96 p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand-200"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-brand-50 text-brand-800">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-black tracking-tight text-ink">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{card.description}</p>
              <p className="mt-4 text-sm font-semibold text-brand-800">Open manager</p>
            </Link>
          );
        })}
      </section>
    </AdminLayout>
  );
}
