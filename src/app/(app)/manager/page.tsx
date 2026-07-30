import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysOverdue } from "@/lib/claims/helpers";
import { ManagerDisputesTable } from "@/components/manager/manager-disputes-table";
import { PendingAssignmentRequestsTable } from "@/components/manager/pending-assignment-requests-table";
import { SlaBreachedAssignmentsTable } from "@/components/manager/sla-breached-assignments-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

async function getSlaBreachedAgencies() {
  const now = new Date();
  const agencies = await prisma.agency.findMany({
    where: {
      status: "ASSIGNED",
      claimExpiresAt: { lt: now },
    },
    include: {
      primaryOwner: { select: { name: true } },
    },
    orderBy: { claimExpiresAt: "asc" },
  });

  return agencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
    location: agency.location,
    primaryOwnerName: agency.primaryOwner?.name ?? null,
    daysOverdue: getDaysOverdue(agency.claimExpiresAt!),
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

  const [pendingRequests, slaBreached, disputedAgencies] = await Promise.all([
    prisma.assignmentRequest.findMany({
      where: { status: "PENDING", agency: { status: "OPEN_RACE" } },
      include: {
        agency: { select: { id: true, name: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getSlaBreachedAgencies(),
    getDisputedAgencies(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review assignment requests, SLA breaches, and co-pilot disputes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Assignment Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingAssignmentRequestsTable requests={pendingRequests} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLA Breached Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <SlaBreachedAssignmentsTable agencies={slaBreached} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disputed Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {disputedAgencies.length === 0 ? (
            <p className="text-sm text-slate-500">No active disputes at this time.</p>
          ) : (
            <ManagerDisputesTable agencies={disputedAgencies} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
