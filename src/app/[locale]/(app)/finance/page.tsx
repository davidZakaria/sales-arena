import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EoiClearanceTable } from "@/components/finance/eoi-clearance-table";
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function FinancePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "FINANCE") {
    redirect("/dashboard");
  }

  const [pendingEois, verifiedEois, statusCounts, pendingAmountAgg] = await Promise.all([
    prisma.eOI.findMany({
      where: { status: "PENDING_FINANCE" },
      orderBy: { createdAt: "asc" },
      include: {
        agency: { select: { id: true, name: true } },
        user: { select: { name: true } },
        brokerContact: { select: { name: true, role: true } },
      },
    }),
    prisma.eOI.findMany({
      where: { status: "VERIFIED" },
      orderBy: { updatedAt: "desc" },
      include: {
        agency: { select: { id: true, name: true } },
        user: { select: { name: true } },
        brokerContact: { select: { name: true, role: true } },
      },
    }),
    prisma.eOI.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.eOI.aggregate({
      where: { status: "PENDING_FINANCE" },
      _sum: { amount: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count]),
  ) as Record<string, number>;

  const t = await getTranslations("finance");
  const tStatus = await getTranslations("status");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <FinanceSummaryCards
        pendingCount={countByStatus.PENDING_FINANCE ?? 0}
        pendingAmount={pendingAmountAgg._sum.amount ?? 0}
        verifiedCount={countByStatus.VERIFIED ?? 0}
        convertedCount={countByStatus.CONVERTED ?? 0}
      />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            {t("tabPending")}
            {pendingEois.length > 0 && (
              <span className="ms-2 rounded-full status-warning px-2 py-0.5 text-xs">
                {pendingEois.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">
            {tStatus("verified")}
            {verifiedEois.length > 0 && (
              <span className="ms-2 rounded-full status-success px-2 py-0.5 text-xs">
                {verifiedEois.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <EoiClearanceTable
            eois={pendingEois}
            emptyMessage={t("emptyPending")}
          />
        </TabsContent>

        <TabsContent value="verified" className="mt-4">
          <EoiClearanceTable
            eois={verifiedEois}
            emptyMessage={t("emptyVerified")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
