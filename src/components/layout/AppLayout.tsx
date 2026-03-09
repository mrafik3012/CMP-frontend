// MODIFIED: 2026-03-03 - Added AppLayout with fixed navbar and padded main content

import { TrialBanner } from "../common/TrialBanner";
import { OfflineBanner } from "../common/OfflineBanner";
import type React from "react";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <OfflineBanner />
      <TrialBanner />
      <Navbar />
      <main className="pt-14">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-2">{children}</div>
      </main>
    </div>
  );
};

