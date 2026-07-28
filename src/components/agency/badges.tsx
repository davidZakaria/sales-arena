import { Badge } from "@/components/ui/badge";
import type { ContractStatus } from "@/generated/prisma/client";

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
