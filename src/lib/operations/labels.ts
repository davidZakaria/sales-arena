import type { ComplianceDocumentType } from "@/generated/prisma/client";

const DOC_LABELS: Record<ComplianceDocumentType, string> = {
  CONTRACT: "Contract",
  TAX_ID: "Tax ID",
  COMMERCIAL_REGISTER: "Commercial Register",
  OTHER: "Other",
};

export function formatDocType(type: ComplianceDocumentType): string {
  return DOC_LABELS[type];
}
