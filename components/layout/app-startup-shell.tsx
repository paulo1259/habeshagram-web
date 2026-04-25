"use client";

import type { ReactNode } from "react";
import { StartupSplash } from "@/components/layout/startup-splash";

export function AppStartupShell({ children }: { children: ReactNode }) {
  return <StartupSplash>{children}</StartupSplash>;
}
