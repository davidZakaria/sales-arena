import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOperationsDashboardData } from "@/lib/operations/queries";
import { AuditQueueTable } from "@/components/operations/audit-queue-table";
import { BulkCsvUpload } from "@/components/operations/bulk-csv-upload";
import { CreateLeadForm } from "@/components/operations/create-lead-form";
import { DraftLeadsTable } from "@/components/operations/draft-leads-table";
import { OperationsActivityFeed } from "@/components/operations/operations-activity-feed";
import { OperationsComplianceWatchTable } from "@/components/operations/operations-compliance-watch-table";
import {
  OperationsIntelligenceCards,
  OperationsPipelineCards,
} from "@/components/operations/operations-pipeline-cards";
import { OperationsOpenRaceTable } from "@/components/operations/operations-open-race-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitleRow } from "@/components/layout/page-title-row";

export default async function OperationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "OPERATIONS") {
    redirect("/dashboard");
  }

  const data = await getOperationsDashboardData();
  const t = await getTranslations("operations");
  const tAgency = await getTranslations("agency");

  return (
    <div className="space-y-6">
      <PageTitleRow title={t("title")} subtitle={t("subtitle")} guideId="operations" />

      <OperationsPipelineCards pipeline={data.pipeline} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
          <TabsTrigger value="intake">
            {t("tabIntake")}
            {data.drafts.length > 0 && (
              <span className="ms-2 rounded-full status-neutral px-2 py-0.5 text-xs">
                {data.drafts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">
            {t("tabAudit")}
            {data.auditQueue.length > 0 && (
              <span className="ms-2 rounded-full status-warning px-2 py-0.5 text-xs">
                {data.auditQueue.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pipeline">{t("tabPipeline")}</TabsTrigger>
          <TabsTrigger value="compliance">
            {t("tabCompliance")}
            {data.complianceWatch.length > 0 && (
              <span className="ms-2 rounded-full status-warning px-2 py-0.5 text-xs">
                {data.complianceWatch.length > 999
                  ? "999+"
                  : data.complianceWatch.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">{tAgency("activityLog")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <OperationsIntelligenceCards
            inboundSourceCounts={data.inboundSourceCounts}
            eoiCounts={data.eoiCounts}
            draftCount={data.drafts.length}
            auditQueueCount={data.auditQueue.length}
          />

          {data.auditQueue.length > 0 && (
            <AuditQueueTable agencies={data.auditQueue} compact />
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <OperationsOpenRaceTable agencies={data.openRace} compact showToolbar={false} />
            <OperationsComplianceWatchTable rows={data.complianceWatch} compact showToolbar={false} />
          </div>
        </TabsContent>

        <TabsContent value="intake" className="mt-4 space-y-6">
          <CreateLeadForm />
          <BulkCsvUpload />
          <DraftLeadsTable drafts={data.drafts} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditQueueTable agencies={data.auditQueue} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4 space-y-6">
          <OperationsOpenRaceTable agencies={data.openRace} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <OperationsComplianceWatchTable rows={data.complianceWatch} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <OperationsActivityFeed activity={data.recentActivity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
