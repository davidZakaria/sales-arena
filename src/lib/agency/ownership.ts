import type { ContractStatus } from "@/generated/prisma/client";
import {
  getAgencyPermissions,
  type AgencyPermissionContext,
} from "@/lib/agency/permissions";

export type AgencyOwnership = AgencyPermissionContext;

export function isAgencyOwner(userId: string, agency: AgencyOwnership): boolean {
  const permissions = getAgencyPermissions(agency, userId, "SALES");
  return permissions.isPrimaryOwner || permissions.isCoPilot;
}

export function canManageCoOwners(
  userId: string,
  role: string,
  agency: AgencyOwnership,
): boolean {
  return getAgencyPermissions(agency, userId, role).canManageCoOwners;
}

const contractStatusLabels: Record<ContractStatus, string> = {
  SIGNED: "Signed",
  PENDING: "Pending",
  MISSING: "Missing",
};

export function buildComplianceAuditActions(
  previous: {
    commercialRegister: string | null;
    taxId: string | null;
    contractStatus: ContractStatus;
  },
  next: {
    commercialRegister: string | null;
    taxId: string | null;
    contractStatus: ContractStatus;
  },
): string[] {
  const actions: string[] = [];

  if (next.commercialRegister && next.commercialRegister !== previous.commercialRegister) {
    actions.push("Updated Commercial Register");
  }

  if (next.taxId && next.taxId !== previous.taxId) {
    actions.push("Uploaded Tax ID");
  }

  if (next.contractStatus !== previous.contractStatus) {
    actions.push(
      `Changed Contract to ${contractStatusLabels[next.contractStatus]}`,
    );
  }

  return actions;
}
