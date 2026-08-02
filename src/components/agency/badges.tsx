"use client";

import { useTranslations } from "next-intl";
import type { AgencyStatus, ContractStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const agencyStatusStyles: Record<AgencyStatus, string> = {
  DRAFT: "status-neutral",
  OPEN_RACE: "status-info",
  ASSIGNED: "status-violet",
  PENDING_AUDIT: "status-warning",
  VERIFIED: "status-success",
  ARCHIVED: "status-danger",
};

const contractStyles: Record<ContractStatus, string> = {
  SIGNED: "status-success",
  PENDING: "status-warning",
  MISSING: "status-danger",
};

const AGENCY_STATUS_KEYS: Record<AgencyStatus, string> = {
  DRAFT: "draft",
  OPEN_RACE: "openRace",
  ASSIGNED: "assigned",
  PENDING_AUDIT: "pendingAudit",
  VERIFIED: "verified",
  ARCHIVED: "archived",
};

const CONTRACT_STATUS_KEYS: Record<ContractStatus, string> = {
  SIGNED: "contractSigned",
  PENDING: "contractPending",
  MISSING: "contractMissing",
};

export function AgencyStatusBadge({ status }: { status: AgencyStatus }) {
  const t = useTranslations("status");
  return (
    <Badge variant="outline" className={cn(agencyStatusStyles[status])}>
      {t(AGENCY_STATUS_KEYS[status])}
    </Badge>
  );
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const t = useTranslations("status");
  return (
    <Badge variant="outline" className={cn(contractStyles[status])}>
      {t(CONTRACT_STATUS_KEYS[status])}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: string | null }) {
  const t = useTranslations("common");
  if (!type) {
    return null;
  }

  return (
    <Badge variant="outline" className="status-neutral">
      {t("type", { type })}
    </Badge>
  );
}

export function MissingDocsBadge() {
  const t = useTranslations("status");
  return (
    <Badge variant="outline" className="status-warning">
      {t("missingDocs")}
    </Badge>
  );
}
