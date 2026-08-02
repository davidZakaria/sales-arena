import type { AgencyStatus, Role } from "@/generated/prisma/client";

export type EoiAgencyContext = {
  primaryOwnerId: string | null;
  coOwners: Array<{ id: string }>;
  status: AgencyStatus;
};

export function canAccessFinanceHub(role: string | undefined): boolean {
  return role === "FINANCE";
}

export function canViewEOIs(
  agency: EoiAgencyContext,
  userId: string | undefined,
  userRole: Role | string | undefined,
): boolean {
  if (!userId) return false;
  if (userRole === "FINANCE" || userRole === "OPERATIONS") return true;
  if (userRole === "MANAGER" || userRole === "DIRECTOR") return true;

  const isPrimaryOwner = agency.primaryOwnerId === userId;
  const isCoPilot = agency.coOwners.some((co) => co.id === userId);
  return isPrimaryOwner || isCoPilot;
}

export function canSubmitEOI(
  agency: EoiAgencyContext,
  userId: string | undefined,
  userRole: Role | string | undefined,
): boolean {
  if (!userId || userRole !== "SALES") return false;
  if (agency.status !== "ASSIGNED" && agency.status !== "VERIFIED") return false;

  const isPrimaryOwner = agency.primaryOwnerId === userId;
  const isCoPilot = agency.coOwners.some((co) => co.id === userId);
  return isPrimaryOwner || isCoPilot;
}

export function canVerifyEOI(role: string | undefined): boolean {
  return role === "FINANCE";
}

export function canRejectEOI(role: string | undefined): boolean {
  return role === "FINANCE";
}

export function canConvertEOI(role: string | undefined): boolean {
  return role === "FINANCE";
}
