import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { AppDataProvider } from "@/hooks/use-app-data";
import { AppStartupShell } from "@/components/layout/app-startup-shell";
import { RadioProvider } from "@/hooks/use-radio";
import { PersistentRadioPlayer } from "@/components/radio/persistent-radio-player";

export const metadata: Metadata = {
  title: "HabeshaGram",
  description: "The premium social home of the Habesha community — reels, live radio, East Africa news, and culture."
};

export const viewport: Viewport = {
  themeColor: "#0b0908"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-ink antialiased">
        <AuthProvider>
          <AppDataProvider>
            <AnalyticsProvider>
              <RadioProvider>
                <AppStartupShell>{children}</AppStartupShell>
                <PersistentRadioPlayer />
              </RadioProvider>
            </AnalyticsProvider>
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
