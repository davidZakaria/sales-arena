"use client";

import { useTranslations } from "next-intl";
import type { EOIStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<EOIStatus, string> = {
  PENDING_FINANCE: "status-warning",
  VERIFIED: "status-success",
  REJECTED: "status-danger",
  CONVERTED: "status-violet",
};

const STATUS_KEYS: Record<EOIStatus, string> = {
  PENDING_FINANCE: "eoiPendingFinance",
  VERIFIED: "verified",
  REJECTED: "eoiRejected",
  CONVERTED: "eoiConverted",
};

export function EoiStatusBadge({ status }: { status: EOIStatus }) {
  const t = useTranslations("status");
  return (
    <Badge variant="outline" className={cn(statusStyles[status])}>
      {t(STATUS_KEYS[status])}
    </Badge>
  );
}
