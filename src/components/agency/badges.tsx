import { Badge } from "@/components/ui/badge";
import type { AgencyStatus, ContractStatus } from "@/generated/prisma/client";

const contractStyles: Record<ContractStatus, string> = {
  SIGNED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  MISSING: "bg-rose-50 text-rose-700 border-rose-200",
};

const contractLabels: Record<ContractStatus, string> = {
  SIGNED: "Signed",
  PENDING: "Pending",
  MISSING: "Missing",
};

const agencyStatusStyles: Record<AgencyStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  OPEN_RACE: "border-blue-200 bg-blue-50 text-blue-800",
  ASSIGNED: "border-violet-200 bg-violet-50 text-violet-800",
  PENDING_AUDIT: "border-amber-200 bg-amber-50 text-amber-800",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  ARCHIVED: "border-rose-200 bg-rose-50 text-rose-800",
};

const agencyStatusLabels: Record<AgencyStatus, string> = {
  DRAFT: "Draft",
  OPEN_RACE: "Open Race",
  ASSIGNED: "Assigned",
  PENDING_AUDIT: "Pending Audit",
  VERIFIED: "Verified",
  ARCHIVED: "Archived",
};

export function AgencyStatusBadge({ status }: { status: AgencyStatus }) {
  return (
    <Badge variant="outline" className={agencyStatusStyles[status]}>
      {agencyStatusLabels[status]}
    </Badge>
  );
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge variant="outline" className={contractStyles[status]}>
      {contractLabels[status]}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: string | null }) {
  if (!type) {
    return null;
  }

  return (
    <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
      Type {type}
    </Badge>
  );
}

export function MissingDocsBadge() {
  return (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
      Missing docs
    </Badge>
  );
}
