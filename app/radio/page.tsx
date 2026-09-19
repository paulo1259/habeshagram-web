import type { Metadata } from "next";
import { RadioPage } from "@/components/radio/radio-page";

export const metadata: Metadata = {
  title: "Radio",
  description:
    "Listen to Addis Ababa and Ethiopian stations in the background while you browse Zema.",
  alternates: { canonical: "/radio" },
  openGraph: {
    title: "Radio · Zema",
    description:
      "Listen to Addis Ababa and Ethiopian stations in the background while you browse Zema.",
    url: "/radio"
  }
};

export default function RadioRoutePage() {
  return <RadioPage />;
}
