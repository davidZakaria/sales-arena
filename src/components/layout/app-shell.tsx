import { getServerSession } from "next-auth";
import { Sidebar, type SidebarBadges } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSidebarBadges(role: string | undefined): Promise<SidebarBadges> {
  if (role === "OPERATIONS") {
    const auditQueue = await prisma.agency.count({
      where: { status: "PENDING_AUDIT" },
    });
    return { auditQueue };
  }

  if (role === "MANAGER" || role === "DIRECTOR") {
    const pendingAssignments = await prisma.assignmentRequest.count({
      where: { status: "PENDING", agency: { status: "OPEN_RACE" } },
    });
    return { pendingAssignments };
  }

  return {};
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const badges = await getSidebarBadges(session?.user?.role);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar badges={badges} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
