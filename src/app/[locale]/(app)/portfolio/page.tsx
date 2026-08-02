import { Link } from "@/i18n/navigation";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { X } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canViewUserPortfolio,
  userAgencyAccessFilter,
} from "@/lib/agency/queries";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
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

  const agencies = await prisma.agency.findMany({
    where: userAgencyAccessFilter(subjectUserId),
    orderBy: { name: "asc" },
  });

  const t = await getTranslations("portfolio");
  const tCommon = await getTranslations("common");

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
      </div>

      {agencies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {viewingOtherUser
              ? t("emptyFor", { name: subjectName })
              : t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => {
            const isPrimary = agency.primaryOwnerId === subjectUserId;

            return (
              <Link key={agency.id} href={`/agency/${agency.id}`}>
                <Card className="transition hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{agency.name}</CardTitle>
                      <TypeBadge type={agency.type} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{agency.location ?? tCommon("locationTbd")}</p>
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
  );
}
