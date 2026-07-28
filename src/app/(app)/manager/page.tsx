import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManagerDisputesTable } from "@/components/manager/manager-disputes-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getDisputedAgencies() {
  const agencies = await prisma.agency.findMany({
    where: { isDisputed: true },
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

export default async function ManagerPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user ||
    (session.user.role !== "MANAGER" && session.user.role !== "DIRECTOR")
  ) {
    redirect("/dashboard");
  }

  const disputedAgencies = await getDisputedAgencies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review territory disputes and arbitrate co-pilot or ownership requests.
        </p>
      </div>

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
