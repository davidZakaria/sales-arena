import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userAgencyAccessFilter } from "@/lib/agency/queries";
import { ClaimExpiryBadge } from "@/components/agency/claim-expiry-badge";
import { PortfolioRoleBadge } from "@/components/agency/portfolio-role-badge";
import { ContractStatusBadge, TypeBadge } from "@/components/agency/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const agencies = userId
    ? await prisma.agency.findMany({
        where: userAgencyAccessFilter(userId),
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          My Portfolio
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Agencies where you are primary owner or co-pilot.
        </p>
      </div>

      {agencies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No agencies assigned yet. Visit the Open Race Market to claim one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => {
            const isPrimary = agency.primaryOwnerId === userId;

            return (
              <Link key={agency.id} href={`/agency/${agency.id}`}>
                <Card className="transition hover:border-slate-300 hover:shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{agency.name}</CardTitle>
                      <TypeBadge type={agency.type} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    <p>{agency.location ?? "Location TBD"}</p>
                    <div className="flex flex-wrap gap-2">
                      <PortfolioRoleBadge role={isPrimary ? "primary" : "co-pilot"} />
                      <ContractStatusBadge status={agency.contractStatus} />
                      <ClaimExpiryBadge claimExpiresAt={agency.claimExpiresAt} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
