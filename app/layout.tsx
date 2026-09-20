import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { siteDescription, siteName, siteTagline, siteUrl } from "@/lib/site";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AuthProvider } from "@/hooks/use-auth";
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
  category: "news",
  keywords: [
    "Ethiopian radio",
    "Eritrean radio",
    "East Africa news",
    "Addis Ababa radio",
    "Amharic radio",
    "Tigrinya",
    "Habesha diaspora",
    "live radio streaming"
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
  themeColor: "#07070c"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-ink antialiased">
        <AuthProvider>
          <AnalyticsProvider>
            <RadioProvider>
              {children}
              <PersistentRadioPlayer />
            </RadioProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
