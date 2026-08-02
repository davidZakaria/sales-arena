"use client";

import { useState } from "react";
import { Sidebar, type SidebarBadges } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";

export function AppShellClient({
  badges,
  children,
}: {
  badges: SidebarBadges;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar badges={badges} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} badges={badges} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
