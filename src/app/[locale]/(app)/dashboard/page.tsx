import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { MessageCircle, X } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canViewUserPortfolio,
  userAgencyAccessFilter,
} from "@/lib/agency/queries";
import {
  countPendingEoisForUser,
  getPendingEoisForUser,
} from "@/lib/agency/eoi-queries";
import { countAssignedInquiriesForSales } from "@/lib/inquiry/queries";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
import { EoiStatusBadge } from "@/components/agency/eoi-badges";
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

const ACTION_STATUS_KEYS: Record<string, string> = {
  ASSIGNED: "uploadCompliance",
  PENDING_AUDIT: "awaitingAudit",
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

  await redirectIfSpecialistRole(viewerRole);

  const t = await getTranslations("dashboard");
  const tTables = await getTranslations("tables");
  const tCommon = await getTranslations("common");

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
    managerQueueCount,
    pendingEoiCount,
    actionAgencies,
    pendingEois,
    assignedInquiryCount,
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
    viewerRole === "MANAGER" || viewerRole === "DIRECTOR"
      ? prisma.agency.count({ where: { status: "OPEN_RACE" } })
      : Promise.resolve(0),
    countPendingEoisForUser(subjectUserId),
    prisma.agency.findMany({
      where: {
        status: { in: ["ASSIGNED", "PENDING_AUDIT"] },
        ...accessFilter,
      },
      orderBy: { name: "asc" },
    }),
    getPendingEoisForUser(subjectUserId),
    viewerRole === "SALES" && !viewingOtherUser
      ? countAssignedInquiriesForSales(subjectUserId)
      : Promise.resolve(0),
  ]);

  const metrics = [
    {
      label: t("actionRequired"),
      value: actionRequiredCount,
      className: "metric-warning",
    },
    {
      label: t("pendingAudit"),
      value: pendingAuditCount,
      className: "metric-violet",
    },
    {
      label: t("verifiedAgencies"),
      value: verifiedCount,
      className: "metric-success",
    },
    ...(viewerRole === "MANAGER" || viewerRole === "DIRECTOR"
      ? [
          {
            label: t("leadsAwaitingAssignment"),
            value: managerQueueCount,
            className: "metric-info",
          },
        ]
      : []),
    ...(viewerRole === "SALES" && !viewingOtherUser
      ? [
          {
            label: t("inquiriesToRespond"),
            value: assignedInquiryCount,
            className: "metric-info",
          },
        ]
      : []),
    {
      label: t("eoisPendingFinance"),
      value: pendingEoiCount,
      className: "metric-danger",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle", { name: subjectName })}
          </p>
        </div>
        {viewingOtherUser && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="status-neutral">
              {tCommon("managerView")}
            </Badge>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2",
              )}
            >
              <X className="h-4 w-4" />
              {tCommon("backToMyDashboard")}
            </Link>
            <Link
              href={`/portfolio?user=${subjectUserId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {tCommon("viewPortfolio")}
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              ? t("needsImmediateActionFor", { name: subjectName })
              : t("needsImmediateAction")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionAgencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {viewingOtherUser
                ? t("noActionRequiredFor", { name: subjectName })
                : t("noActionRequired")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tTables("agency")}</TableHead>
                  <TableHead>{tCommon("status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{tTables("action")}</TableHead>
                  <TableHead className="hidden text-end lg:table-cell">{tTables("contact")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <Link
                        href={`/agency/${agency.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {agency.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{agency.location}</p>
                    </TableCell>
                    <TableCell>
                      <AgencyStatusBadge status={agency.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-warning-foreground">
                      {ACTION_STATUS_KEYS[agency.status]
                        ? t(ACTION_STATUS_KEYS[agency.status])
                        : t("reviewRequired")}
                    </TableCell>
                    <TableCell className="hidden text-end lg:table-cell">
                      {agency.whatsappLink ? (
                        <Link
                          href={agency.whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <MessageCircle className="me-2 h-4 w-4" />
                          {tCommon("whatsapp")}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">{tCommon("noLink")}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {viewerRole === "SALES" && !viewingOtherUser && assignedInquiryCount > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>{t("inquiriesToRespond")}</CardTitle>
            <Link
              href="/portfolio"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {t("openMyWork")}
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("inquiriesToRespondHint", { count: assignedInquiryCount })}
            </p>
          </CardContent>
        </Card>
      )}

      {pendingEois.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {viewingOtherUser
                ? t("eoisPendingFinanceFor", { name: subjectName })
                : t("eoisPendingFinance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tTables("agency")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{tTables("client")}</TableHead>
                  <TableHead className="hidden md:table-cell">{tTables("project")}</TableHead>
                  <TableHead>{tTables("amount")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{tCommon("status")}</TableHead>
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
                    <TableCell className="hidden sm:table-cell">{eoi.clientName}</TableCell>
                    <TableCell className="hidden md:table-cell">{eoi.project}</TableCell>
                    <TableCell>{eoi.amount.toLocaleString()} EGP</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <EoiStatusBadge status={eoi.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
