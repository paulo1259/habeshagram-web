import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { siteDescription, siteName, siteTagline, siteUrl } from "@/lib/site";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { AppDataProvider } from "@/hooks/use-app-data";
import { AppStartupShell } from "@/components/layout/app-startup-shell";
import { RadioProvider } from "@/hooks/use-radio";
import { PersistentRadioPlayer } from "@/components/radio/persistent-radio-player";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s · ${siteName}`
  },
  description: siteDescription,
  applicationName: siteName,
  category: "social",
  keywords: [
    "Habesha",
    "Ethiopian community",
    "Eritrean community",
    "Ethiopian radio",
    "East Africa news",
    "Habesha diaspora",
    "Amharic",
    "Tigrinya",
    "Addis Ababa"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
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
