import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_TEMPORARY_CLAIMS } from "@/lib/claims/constants";
import { countActiveTemporaryClaims } from "@/lib/claims/helpers";
import { ActiveClaimsBadge } from "@/components/open-race/active-claims-badge";
import { OpenRaceCard } from "@/components/open-race/open-race-card";

export default async function OpenRacePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [agencies, activeClaims] = await Promise.all([
    prisma.agency.findMany({
      where: { status: "OPEN_RACE" },
      orderBy: { name: "asc" },
    }),
    userId ? countActiveTemporaryClaims(userId) : Promise.resolve(0),
  ]);

  const claimLimitReached = activeClaims >= MAX_TEMPORARY_CLAIMS;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Open Race Market
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Claim unassigned broker agencies and add them to your portfolio. You
            have 14 days to secure compliance data before a claim expires.
          </p>
        </div>
        {userId && <ActiveClaimsBadge count={activeClaims} />}
      </div>

      {claimLimitReached && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          You have reached your temporary claim limit. Complete Tax ID and
          contract work on existing leads before claiming more agencies.
        </p>
      )}

      {agencies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">
            No agencies are currently in Open Race.
          </p>
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
              claimLimitReached={claimLimitReached}
            />
          ))}
        </div>
      )}
    </div>
  );
}
