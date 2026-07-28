import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { ClaimAgencyButton } from "@/components/agency/claim-button";
import { AgencyDetailTabs } from "@/components/agency/agency-detail-tabs";
import { AccountTeamCard } from "@/components/agency/account-team-card";
import { ContractStatusBadge, TypeBadge } from "@/components/agency/badges";
import { ClaimExpiryBadge } from "@/components/agency/claim-expiry-badge";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getAgencyPermissions } from "@/lib/agency/permissions";
import { MAX_TEMPORARY_CLAIMS } from "@/lib/claims/constants";
import { countActiveTemporaryClaims } from "@/lib/claims/helpers";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getAgency(id: string) {
  return prisma.agency.findUnique({
    where: { id },
    include: {
      primaryOwner: {
        include: {
          manager: {
            include: {
              manager: true,
            },
          },
        },
      },
      coOwners: {
        select: { id: true, name: true, email: true },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });
}

export default async function AgencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const [agency, salesUsers, activeClaims] = await Promise.all([
    getAgency(id),
    prisma.user.findMany({
      where: { role: "SALES" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    session?.user?.id
      ? countActiveTemporaryClaims(session.user.id)
      : Promise.resolve(0),
  ]);

  if (!agency) {
    notFound();
  }

  const claimLimitReached = activeClaims >= MAX_TEMPORARY_CLAIMS;
  const primaryOwner = agency.primaryOwner;
  const manager = primaryOwner?.manager;
  const director = manager?.manager;
  const userId = session?.user?.id;
  const permissions = getAgencyPermissions(
    agency,
    userId,
    session?.user?.role,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {agency.name}
            </h1>
            <TypeBadge type={agency.type} />
            <ContractStatusBadge status={agency.contractStatus} />
            <ClaimExpiryBadge claimExpiresAt={agency.claimExpiresAt} />
            {agency.isDisputed && (
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                Disputed
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {agency.status === "OPEN_RACE"
              ? "Available in Open Race"
              : "Assigned agency profile"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {agency.whatsappLink && (
            <Link
              href={agency.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Launch WhatsApp
            </Link>
          )}
          {agency.status === "OPEN_RACE" && (
            <ClaimAgencyButton
              agencyId={agency.id}
              agencyName={agency.name}
              disabled={claimLimitReached}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agency Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700">Rep Phone</p>
                  <p className="text-slate-600">{agency.repPhone1 ?? "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700">Location</p>
                  <p className="text-slate-600">{agency.location ?? "Not provided"}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="mb-3 font-medium text-slate-700">Internal Team Hierarchy</p>
                <div className="space-y-2 rounded-lg bg-slate-50 p-4">
                  <p>
                    <span className="text-slate-500">Sales:</span>{" "}
                    {primaryOwner?.name ?? "Unassigned"}
                  </p>
                  <p>
                    <span className="text-slate-500">Manager:</span>{" "}
                    {manager?.name ?? "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Director:</span>{" "}
                    {director?.name ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AccountTeamCard
            agencyId={agency.id}
            agencyName={agency.name}
            primaryOwner={
              primaryOwner
                ? {
                    id: primaryOwner.id,
                    name: primaryOwner.name,
                    email: primaryOwner.email,
                  }
                : null
            }
            coOwners={agency.coOwners}
            permissions={permissions}
            salesUsers={salesUsers}
          />
        </div>

        <AgencyDetailTabs
          agencyId={agency.id}
          commercialRegister={agency.commercialRegister}
          taxId={agency.taxId}
          contractStatus={agency.contractStatus}
          activityLogs={agency.auditLogs}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
