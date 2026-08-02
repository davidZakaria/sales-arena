import { getServerSession } from "next-auth";
import { AppShellClient } from "@/components/layout/app-shell-client";
import type { SidebarBadges } from "@/components/layout/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSidebarBadges(role: string | undefined): Promise<SidebarBadges> {
  if (role === "OPERATIONS") {
    const [auditQueue, draftCount] = await Promise.all([
      prisma.agency.count({ where: { status: "PENDING_AUDIT" } }),
      prisma.agency.count({ where: { status: "DRAFT" } }),
    ]);
    return { auditQueue, draftCount };
  }

  if (role === "FINANCE") {
    const pendingEois = await prisma.eOI.count({
      where: { status: "PENDING_FINANCE" },
    });
    return { pendingEois };
  }

  if (role === "MANAGER" || role === "DIRECTOR") {
    const unassignedLeadCount = await prisma.agency.count({
      where: { status: "OPEN_RACE" },
    });
    return { unassignedLeadCount };
  }

  return {};
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const badges = await getSidebarBadges(session?.user?.role);

  return <AppShellClient badges={badges}>{children}</AppShellClient>;
}
