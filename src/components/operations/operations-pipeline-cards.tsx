"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { OperationsPipelineCounts } from "@/lib/operations/queries";
import type { EOIStatus, InboundSource } from "@/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PIPELINE_KEYS: Array<{
  key: keyof OperationsPipelineCounts;
  labelKey: string;
  hintKey: string;
  className: string;
}> = [
  {
    key: "DRAFT",
    labelKey: "pipelineDraft",
    hintKey: "pipelineDraftHint",
    className: "metric-slate",
  },
  {
    key: "OPEN_RACE",
    labelKey: "pipelineOpenRace",
    hintKey: "pipelineOpenRaceHint",
    className: "metric-info",
  },
  {
    key: "ASSIGNED",
    labelKey: "pipelineAssigned",
    hintKey: "pipelineAssignedHint",
    className: "metric-violet",
  },
  {
    key: "PENDING_AUDIT",
    labelKey: "pipelinePendingAudit",
    hintKey: "pipelinePendingAuditHint",
    className: "metric-warning",
  },
  {
    key: "VERIFIED",
    labelKey: "pipelineVerified",
    hintKey: "pipelineVerifiedHint",
    className: "metric-success",
  },
  {
    key: "ARCHIVED",
    labelKey: "pipelineArchived",
    hintKey: "pipelineArchivedHint",
    className: "metric-danger",
  },
];

export function OperationsPipelineCards({
  pipeline,
}: {
  pipeline: OperationsPipelineCounts;
}) {
  const t = useTranslations("operations");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {PIPELINE_KEYS.map(({ key, labelKey, hintKey, className }) => (
        <Card key={key} className={className}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-current/70">
              {t(labelKey)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pipeline[key]}</p>
            <p className="mt-1 text-xs opacity-80">{t(hintKey)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const INBOUND_SOURCE_KEYS: Record<InboundSource, string> = {
  OPERATIONS: "operations",
  PUBLIC_PORTAL: "portal",
  WHATSAPP: "whatsapp",
};

const INBOUND_SOURCES: InboundSource[] = ["OPERATIONS", "PUBLIC_PORTAL", "WHATSAPP"];
const EOI_STATUSES: EOIStatus[] = ["PENDING_FINANCE", "VERIFIED", "REJECTED", "CONVERTED"];

export function OperationsIntelligenceCards({
  inboundSourceCounts,
  eoiCounts,
  draftCount,
  auditQueueCount,
}: {
  inboundSourceCounts: Partial<Record<InboundSource, number>>;
  eoiCounts: Partial<Record<EOIStatus, number>>;
  draftCount: number;
  auditQueueCount: number;
}) {
  const t = useTranslations("operations");
  const tInbound = useTranslations("inbound");
  const tStatus = useTranslations("status");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("intakeSignals")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {INBOUND_SOURCES.map((source) => (
            <div key={source} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{tInbound(INBOUND_SOURCE_KEYS[source])}</span>
              <span className="font-medium tabular-nums">
                {inboundSourceCounts[source] ?? 0}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <span className="text-muted-foreground">{t("pipelineDraft")}</span>
            <span className="font-medium tabular-nums">{draftCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t("auditQueue")}</span>
            <span className="font-medium tabular-nums">{auditQueueCount}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("downstreamSignals")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {EOI_STATUSES.map((status) => (
            <div key={status} className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {status === "PENDING_FINANCE"
                  ? tStatus("eoiPendingFinance")
                  : status === "REJECTED"
                    ? tStatus("eoiRejected")
                    : status === "CONVERTED"
                      ? tStatus("eoiConverted")
                      : tStatus("verified")}
              </span>
              <span className="font-medium tabular-nums">{eoiCounts[status] ?? 0}</span>
            </div>
          ))}
          <p className="border-t border-border pt-2 text-xs text-muted-foreground">
            <Link href="/finance" className="font-medium text-foreground underline">
              {t("openFinanceHub")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
