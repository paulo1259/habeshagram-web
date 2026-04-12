import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { AppDataProvider } from "@/hooks/use-app-data";

export const metadata: Metadata = {
  title: "HabeshaGram",
  description: "A warm mobile-first social app for the Habesha community."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink antialiased">
        <AuthProvider>
          <AppDataProvider>{children}</AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
