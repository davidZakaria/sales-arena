import type { AgencyStatus, Role } from "@/generated/prisma/client";

export type BrokerContactAgencyContext = {
  primaryOwnerId: string | null;
  coOwners: Array<{ id: string }>;
  status: AgencyStatus;
};

export function canViewBrokerContacts(
  agency: BrokerContactAgencyContext,
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

export function canManageBrokerContacts(
  agency: BrokerContactAgencyContext,
  userId: string | undefined,
  userRole: Role | string | undefined,
): boolean {
  if (!userId) return false;
  if (agency.status === "ARCHIVED" || agency.status === "DRAFT" || agency.status === "OPEN_RACE") {
    return false;
  }

  if (userRole === "MANAGER" || userRole === "DIRECTOR") return true;
  if (userRole !== "SALES") return false;
  if (agency.status !== "ASSIGNED" && agency.status !== "VERIFIED") return false;

  const isPrimaryOwner = agency.primaryOwnerId === userId;
  const isCoPilot = agency.coOwners.some((co) => co.id === userId);
  return isPrimaryOwner || isCoPilot;
}
