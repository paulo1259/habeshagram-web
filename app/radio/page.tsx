import type { Metadata } from "next";
import { RadioPage } from "@/components/radio/radio-page";

export const metadata: Metadata = {
  title: "Radio",
  description:
    "Listen to Addis Ababa and Ethiopian stations in the background while you browse HabeshaGram.",
  alternates: { canonical: "/radio" },
  openGraph: {
    title: "Radio · HabeshaGram",
    description:
      "Listen to Addis Ababa and Ethiopian stations in the background while you browse HabeshaGram.",
    url: "/radio"
  }
};

export default function RadioRoutePage() {
  return <RadioPage />;
}
