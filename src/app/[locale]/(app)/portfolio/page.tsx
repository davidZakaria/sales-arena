import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { Package, X } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canViewUserPortfolio,
  userAgencyAccessFilter,
} from "@/lib/agency/queries";
import {
  getActiveInventoryTemplates,
  getAssignedInquiriesForSales,
} from "@/lib/inquiry/queries";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
import { InquiriesTable } from "@/components/inquiries/inquiries-table";
import { PortfolioRoleBadge } from "@/components/agency/portfolio-role-badge";
import { AgencyStatusBadge, ContractStatusBadge, TypeBadge } from "@/components/agency/badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function PortfolioPage({
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

  await redirectIfSpecialistRole(viewerRole);

  let subjectUserId = viewerId;
  let subjectName = session.user.name ?? "You";
  let viewingOtherUser = false;
  const isSalesOwnView = viewerRole === "SALES" && !targetUserId;

  if (targetUserId && targetUserId !== viewerId) {
    if (!canViewUserPortfolio(viewerRole, viewerId, targetUserId)) {
      redirect("/portfolio");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      notFound();
    }

    subjectUserId = targetUser.id;
    subjectName = targetUser.name;
    viewingOtherUser = true;
  }

  const accessFilter = userAgencyAccessFilter(subjectUserId);

  const [agencies, assignedCount, pendingAuditCount, verifiedCount, inquiries, templates] =
    await Promise.all([
      prisma.agency.findMany({
        where: accessFilter,
        include: {
          primaryOwner: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.agency.count({
        where: { status: "ASSIGNED", ...accessFilter },
      }),
      prisma.agency.count({
        where: { status: "PENDING_AUDIT", ...accessFilter },
      }),
      prisma.agency.count({
        where: { status: "VERIFIED", ...accessFilter },
      }),
      isSalesOwnView
        ? getAssignedInquiriesForSales(viewerId)
        : Promise.resolve([]),
      isSalesOwnView ? getActiveInventoryTemplates() : Promise.resolve([]),
    ]);

  const inquiryRows = inquiries.map((inquiry) => ({
    id: inquiry.id,
    brokerPhone: inquiry.brokerPhone,
    rawMessage: inquiry.rawMessage,
    createdAt: inquiry.createdAt,
    agencyName: inquiry.agency?.name ?? null,
  }));

  const t = await getTranslations("portfolio");
  const tCommon = await getTranslations("common");
  const showInquiries = isSalesOwnView;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {viewingOtherUser ? t("titleFor", { name: subjectName }) : t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {viewingOtherUser
              ? t("subtitleViewing", { name: subjectName })
              : showInquiries
                ? t("subtitleSales")
                : t("subtitleOwned")}
          </p>
        </div>
        {viewingOtherUser && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="status-neutral">
              {tCommon("managerView")}
            </Badge>
            <Link
              href={`/dashboard?user=${subjectUserId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {tCommon("viewDashboard")}
            </Link>
            <Link
              href="/portfolio"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2",
              )}
            >
              <X className="h-4 w-4" />
              {tCommon("backToMyPortfolio")}
            </Link>
          </div>
        )}
        {showInquiries && (
          <Link
            href="/inventory"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 min-h-11 sm:min-h-0",
            )}
          >
            <Package className="h-4 w-4" />
            {t("openInventory")}
          </Link>
        )}
      </div>

      {showInquiries && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="metric-info">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-current/70">
                {t("metricInquiries")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{inquiryRows.length}</p>
              <p className="mt-1 text-xs opacity-80">{t("metricInquiriesHint")}</p>
            </CardContent>
          </Card>
          <Card className="metric-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-current/70">
                {t("metricAssignedAgencies")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{assignedCount}</p>
              <p className="mt-1 text-xs opacity-80">{t("metricAssignedHint")}</p>
            </CardContent>
          </Card>
          <Card className="metric-violet">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-current/70">
                {t("metricPendingAudit")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{pendingAuditCount}</p>
            </CardContent>
          </Card>
          <Card className="metric-success">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-current/70">
                {t("metricVerified")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{verifiedCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {showInquiries && (
        <InquiriesTable inquiries={inquiryRows} templates={templates} />
      )}

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {showInquiries ? t("agenciesSection") : t("title")}
          </h2>
          {showInquiries && (
            <p className="mt-1 text-sm text-muted-foreground">{t("agenciesSectionHint")}</p>
          )}
        </div>

        {agencies.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {viewingOtherUser
                ? t("emptyFor", { name: subjectName })
                : showInquiries
                  ? t("emptySales")
                  : t("empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agencies.map((agency) => {
              const isPrimary = agency.primaryOwnerId === subjectUserId;

              return (
                <Link key={agency.id} href={`/agency/${agency.id}`}>
                  <Card className="h-full transition hover:border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{agency.name}</CardTitle>
                        <TypeBadge type={agency.type} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>{agency.location ?? tCommon("locationTbd")}</p>
                      {!isPrimary && agency.primaryOwner && (
                        <p className="text-xs">
                          {t("primaryOwnerLabel", { name: agency.primaryOwner.name })}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <PortfolioRoleBadge role={isPrimary ? "primary" : "co-pilot"} />
                        <AgencyStatusBadge status={agency.status} />
                        <ContractStatusBadge status={agency.contractStatus} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
