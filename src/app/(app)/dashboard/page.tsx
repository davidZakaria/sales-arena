import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { MessageCircle, X } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canViewUserPortfolio,
  userAgencyAccessFilter,
} from "@/lib/agency/queries";
import { AgencyStatusBadge } from "@/components/agency/badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Upload compliance documents",
  PENDING_AUDIT: "Awaiting Operations audit",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { user: targetUserId } = await searchParams;
  const viewerId = session?.user?.id;
  const viewerRole = session?.user?.role;

  if (!viewerId || !viewerRole) {
    redirect("/login");
  }

  if (viewerRole === "OPERATIONS") {
    redirect("/operations");
  }

  let subjectUserId = viewerId;
  let subjectName = session.user.name ?? "You";
  let viewingOtherUser = false;

  if (targetUserId && targetUserId !== viewerId) {
    if (!canViewUserPortfolio(viewerRole, viewerId, targetUserId)) {
      redirect("/dashboard");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true },
    });

    if (!targetUser) {
      notFound();
    }

    subjectUserId = targetUser.id;
    subjectName = targetUser.name;
    viewingOtherUser = true;
  }

  const accessFilter = userAgencyAccessFilter(subjectUserId);

  const [
    actionRequiredCount,
    pendingAuditCount,
    verifiedCount,
    openRaceCount,
    actionAgencies,
  ] = await Promise.all([
    prisma.agency.count({
      where: { status: "ASSIGNED", ...accessFilter },
    }),
    prisma.agency.count({
      where: { status: "PENDING_AUDIT", ...accessFilter },
    }),
    prisma.agency.count({
      where: { status: "VERIFIED", ...accessFilter },
    }),
    prisma.agency.count({ where: { status: "OPEN_RACE" } }),
    prisma.agency.findMany({
      where: {
        status: { in: ["ASSIGNED", "PENDING_AUDIT"] },
        ...accessFilter,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const metrics = [
    {
      label: "Action Required (Missing Docs)",
      value: actionRequiredCount,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      label: "Agencies Pending Audit",
      value: pendingAuditCount,
      className: "border-violet-200 bg-violet-50 text-violet-900",
    },
    {
      label: "Verified Agencies",
      value: verifiedCount,
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Open Race Available",
      value: openRaceCount,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pipeline overview for {subjectName}
          </p>
        </div>
        {viewingOtherUser && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-300 bg-slate-50">
              Manager view
            </Badge>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2",
              )}
            >
              <X className="h-4 w-4" />
              Back to my dashboard
            </Link>
            <Link
              href={`/portfolio?user=${subjectUserId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              View portfolio
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className={metric.className}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-current/70">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {viewingOtherUser
              ? `Needs Immediate Action — ${subjectName}`
              : "Needs Immediate Action"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionAgencies.length === 0 ? (
            <p className="text-sm text-slate-500">
              {viewingOtherUser
                ? `${subjectName} has no agencies needing immediate action.`
                : "No agencies require uploads or audit follow-up."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <Link
                        href={`/agency/${agency.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {agency.name}
                      </Link>
                      <p className="text-xs text-slate-500">{agency.location}</p>
                    </TableCell>
                    <TableCell>
                      <AgencyStatusBadge status={agency.status} />
                    </TableCell>
                    <TableCell className="text-amber-800">
                      {ACTION_STATUS_LABELS[agency.status] ?? "Review required"}
                    </TableCell>
                    <TableCell className="text-right">
                      {agency.whatsappLink ? (
                        <Link
                          href={agency.whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">No link</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
