"use client";

import { useTranslations } from "next-intl";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

export type SidebarBadges = {
  auditQueue?: number;
  draftCount?: number;
  unassignedLeadCount?: number;
  pendingEois?: number;
};

export function Sidebar({
  badges = {},
  className,
}: {
  badges?: SidebarBadges;
  className?: string;
}) {
  const tCommon = useTranslations("common");

  return (
    <aside
      className={cn(
        "hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex",
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sidebar-muted">
          {tCommon("companyName")}
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-sidebar-foreground">
          {tCommon("appName")}
        </h1>
      </div>
      <SidebarNav badges={badges} className="flex-1 p-4" />
    </aside>
  );
}
