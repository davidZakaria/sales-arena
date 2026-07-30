import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { AgencyDetailTabs } from "@/components/agency/agency-detail-tabs";
import { AccountTeamCard } from "@/components/agency/account-team-card";
import {
  AgencyStatusBadge,
  ContractStatusBadge,
  TypeBadge,
} from "@/components/agency/badges";
import { ArchiveAgencyButton } from "@/components/agency/archive-agency-button";
import { DirectAssignSelect } from "@/components/open-race/direct-assign-select";
import { RequestAssignmentDialog } from "@/components/open-race/request-assignment-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getAgencyPermissions, canDirectAssign, canArchiveAgency } from "@/lib/agency/permissions";
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
      complianceDocuments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { name: true } },
        },
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role ?? "";

  if (userRole === "OPERATIONS" && mode !== "audit") {
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { status: true },
    });
    if (agency?.status === "PENDING_AUDIT") {
      redirect(`/agency/${id}?mode=audit`);
    }
  }

  const [agency, salesUsers, pendingRequest] = await Promise.all([
    getAgency(id),
    canDirectAssign(userRole)
      ? prisma.user.findMany({
          where: {
            role: "SALES",
            ...(userRole === "MANAGER" && userId ? { managerId: userId } : {}),
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    userId
      ? prisma.assignmentRequest.findFirst({
          where: { agencyId: id, userId, status: "PENDING" },
        })
      : Promise.resolve(null),
  ]);

  if (!agency) {
    notFound();
  }

  const primaryOwner = agency.primaryOwner;
  const manager = primaryOwner?.manager;
  const director = manager?.manager;
  const permissions = getAgencyPermissions(agency, userId, userRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {agency.name}
            </h1>
            <TypeBadge type={agency.type} />
            <AgencyStatusBadge status={agency.status} />
            <ContractStatusBadge status={agency.contractStatus} />
            {agency.isDisputed && (
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                Disputed
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {agency.status === "OPEN_RACE"
              ? "Available in Open Race — request assignment from your manager"
              : agency.status === "PENDING_AUDIT"
                ? "Compliance documents submitted — awaiting Operations audit"
              : agency.status === "ARCHIVED"
                ? "This agency has been archived and is no longer active"
                : "Assigned agency profile"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
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
          {agency.status === "OPEN_RACE" && userRole === "SALES" && (
            <RequestAssignmentDialog
              agencyId={agency.id}
              agencyName={agency.name}
              pending={Boolean(pendingRequest)}
            />
          )}
            {agency.status === "OPEN_RACE" && canDirectAssign(userRole) && (
            <div className="min-w-[200px]">
              <DirectAssignSelect agencyId={agency.id} salesUsers={salesUsers} />
            </div>
          )}
          {canArchiveAgency(userRole) && agency.status !== "ARCHIVED" && (
            <ArchiveAgencyButton agencyId={agency.id} agencyName={agency.name} />
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
          agencyStatus={agency.status}
          commercialRegister={agency.commercialRegister}
          taxId={agency.taxId}
          contractStatus={agency.contractStatus}
          documents={agency.complianceDocuments}
          activityLogs={agency.auditLogs}
          permissions={permissions}
          defaultTab={mode === "audit" ? "compliance" : "compliance"}
        />
      </div>
    </div>
  );
}
