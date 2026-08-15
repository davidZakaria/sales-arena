import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { Link } from "@/i18n/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  countPendingEoisForManager,
  getBrokerEoiStatsForManager,
  getPendingEoisForManager,
} from "@/lib/agency/eoi-queries";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
import { canDirectAssign } from "@/lib/agency/permissions";
import { EoiStatusBadge } from "@/components/agency/eoi-badges";
import { BrokerEoiPerformanceTable } from "@/components/manager/broker-eoi-performance-table";
import { ManagerDisputesTable } from "@/components/manager/manager-disputes-table";
import { ManagerTeamAssignmentsTable } from "@/components/manager/manager-team-assignments-table";
import { ManagerLeadAssignmentTable } from "@/components/manager/manager-lead-assignment-table";
import { LiveInquiriesQueue } from "@/components/manager/live-inquiries-queue";
import { getNewInquiries } from "@/lib/inquiry/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitleRow } from "@/components/layout/page-title-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function getDisputedAgencies() {
  const agencies = await prisma.agency.findMany({
    where: { isDisputed: true, status: { not: "ARCHIVED" } },
    include: {
      primaryOwner: { select: { name: true } },
      auditLogs: {
        where: { action: { contains: "Dispute" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return agencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
    location: agency.location,
    primaryOwnerName: agency.primaryOwner?.name ?? null,
    disputant: agency.auditLogs[0]?.user ?? null,
  }));
}

async function getUnassignedLeads() {
  return prisma.agency.findMany({
    where: { status: "OPEN_RACE" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      shortCode: true,
      location: true,
      type: true,
      source: true,
      repPhone1: true,
      createdAt: true,
    },
  });
}

async function getTeamAssignments(viewerId: string, viewerRole: string) {
  const teamScope =
    viewerRole === "DIRECTOR"
      ? {}
      : {
          OR: [
            { primaryOwner: { managerId: viewerId } },
            { coOwners: { some: { managerId: viewerId } } },
          ],
        };

  const agencies = await prisma.agency.findMany({
    where: {
      status: { in: ["ASSIGNED", "PENDING_AUDIT", "VERIFIED"] },
      ...teamScope,
    },
    include: {
      primaryOwner: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return agencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
    location: agency.location,
    status: agency.status,
    primaryOwnerName: agency.primaryOwner?.name ?? null,
  }));
}

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    (session.user.role !== "MANAGER" && session.user.role !== "DIRECTOR")
  ) {
    redirect("/dashboard");
  }

  await redirectIfSpecialistRole(session.user.role);

  const viewerId = session.user.id;
  const viewerRole = session.user.role;

  const [
    unassignedLeads,
    salesUsers,
    disputedAgencies,
    pendingEoiCount,
    pendingEois,
    brokerStats,
    teamAssignments,
    newInquiries,
  ] = await Promise.all([
    getUnassignedLeads(),
    canDirectAssign(viewerRole)
      ? prisma.user.findMany({
          where: {
            role: "SALES",
            ...(viewerRole === "MANAGER" ? { managerId: viewerId } : {}),
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    getDisputedAgencies(),
    countPendingEoisForManager(viewerId, viewerRole),
    getPendingEoisForManager(viewerId, viewerRole),
    getBrokerEoiStatsForManager(viewerId, viewerRole),
    getTeamAssignments(viewerId, viewerRole),
    getNewInquiries(),
  ]);

  const liveInquiries = newInquiries.map((inquiry) => ({
    id: inquiry.id,
    brokerPhone: inquiry.brokerPhone,
    rawMessage: inquiry.rawMessage,
    createdAt: inquiry.createdAt,
    agencyName: inquiry.agency?.name ?? null,
  }));

  const t = await getTranslations("manager");
  const tInquiry = await getTranslations("inquiry");
  const tTables = await getTranslations("tables");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <PageTitleRow title={t("title")} subtitle={t("subtitle")} guideId="manager" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="metric-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-current/70">
              {tInquiry("liveInquiriesMetric")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{liveInquiries.length}</p>
            <p className="mt-1 text-xs opacity-80">{tInquiry("liveInquiriesHint")}</p>
          </CardContent>
        </Card>
        <Card className="metric-info">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-current/70">
              {t("leadsAwaitingAssignment")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{unassignedLeads.length}</p>
            <p className="mt-1 text-xs opacity-80">{t("leadsAwaitingHint")}</p>
          </CardContent>
        </Card>
        <Card className="metric-violet">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-current/70">
              {t("eoisPendingFinance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingEoiCount}</p>
            <p className="mt-1 text-xs opacity-80">{t("acrossTeamAgencies")}</p>
          </CardContent>
        </Card>
      </div>

      <LiveInquiriesQueue inquiries={liveInquiries} salesUsers={salesUsers} />

      <ManagerLeadAssignmentTable leads={unassignedLeads} salesUsers={salesUsers} />

      <ManagerTeamAssignmentsTable agencies={teamAssignments} />

      <Card>
        <CardHeader>
          <CardTitle>{t("disputedSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          {disputedAgencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noDisputes")}</p>
          ) : (
            <ManagerDisputesTable agencies={disputedAgencies} />
          )}
        </CardContent>
      </Card>

      {pendingEois.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("teamEoisSection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tTables("agency")}</TableHead>
                  <TableHead>{tTables("client")}</TableHead>
                  <TableHead>{tTables("salesRep")}</TableHead>
                  <TableHead>{tTables("broker")}</TableHead>
                  <TableHead>{tTables("amount")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEois.map((eoi) => (
                  <TableRow key={eoi.id}>
                    <TableCell>
                      <Link
                        href={`/agency/${eoi.agency.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {eoi.agency.name}
                      </Link>
                    </TableCell>
                    <TableCell>{eoi.clientName}</TableCell>
                    <TableCell>{eoi.user.name}</TableCell>
                    <TableCell>{eoi.brokerContact?.name ?? "—"}</TableCell>
                    <TableCell>{eoi.amount.toLocaleString()} EGP</TableCell>
                    <TableCell>
                      <EoiStatusBadge status={eoi.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <BrokerEoiPerformanceTable rows={brokerStats} />
    </div>
  );
}
