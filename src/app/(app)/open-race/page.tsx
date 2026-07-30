import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDirectAssign } from "@/lib/agency/permissions";
import { OpenRaceCard } from "@/components/open-race/open-race-card";

export default async function OpenRacePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role ?? "";

  const [agencies, pendingRequests, salesUsers] = await Promise.all([
    prisma.agency.findMany({
      where: { status: "OPEN_RACE" },
      orderBy: { name: "asc" },
    }),
    userId
      ? prisma.assignmentRequest.findMany({
          where: { userId, status: "PENDING" },
          select: { agencyId: true },
        })
      : Promise.resolve([]),
    canDirectAssign(userRole)
      ? prisma.user.findMany({
          where: {
            role: "SALES",
            ...(userRole === "MANAGER" && session?.user?.id
              ? { managerId: session.user.id }
              : {}),
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const pendingAgencyIds = new Set(pendingRequests.map((r) => r.agencyId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Open Race Market
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Request assignment from your manager. Instant claiming is disabled — all
          territory assignments are manager-approved.
        </p>
      </div>

      {agencies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No agencies are currently in Open Race.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => (
            <OpenRaceCard
              key={agency.id}
              id={agency.id}
              name={agency.name}
              location={agency.location}
              type={agency.type}
              userRole={userRole}
              hasPendingRequest={pendingAgencyIds.has(agency.id)}
              salesUsers={salesUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
