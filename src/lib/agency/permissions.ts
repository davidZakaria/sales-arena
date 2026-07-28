import type { AgencyStatus, Role } from "@/generated/prisma/client";

export type AgencyPermissionContext = {
  primaryOwnerId: string | null;
  coOwners: Array<{ id: string }>;
  status?: AgencyStatus;
};

export type AgencyPermissionRole =
  | "primary"
  | "co-pilot"
  | "manager"
  | "director"
  | "non-owner";

export type AgencyPermissions = {
  role: AgencyPermissionRole;
  canView: boolean;
  canEditCompliance: boolean;
  canUploadDocuments: boolean;
  canManageCoOwners: boolean;
  canDispute: boolean;
  isPrimaryOwner: boolean;
  isCoPilot: boolean;
  isManagerOverride: boolean;
};

export function getAgencyPermissions(
  agency: AgencyPermissionContext,
  userId: string | undefined,
  userRole: Role | string | undefined,
): AgencyPermissions {
  const isManagerOverride = userRole === "MANAGER" || userRole === "DIRECTOR";
  const isPrimaryOwner = Boolean(userId && agency.primaryOwnerId === userId);
  const isCoPilot = Boolean(
    userId && agency.coOwners.some((coOwner) => coOwner.id === userId),
  );

  if (!userId) {
    return {
      role: "non-owner",
      canView: false,
      canEditCompliance: false,
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      isPrimaryOwner: false,
      isCoPilot: false,
      isManagerOverride: false,
    };
  }

  if (isManagerOverride) {
    return {
      role: userRole === "DIRECTOR" ? "director" : "manager",
      canView: true,
      canEditCompliance: true,
      canUploadDocuments: true,
      canManageCoOwners: true,
      canDispute: false,
      isPrimaryOwner: false,
      isCoPilot: false,
      isManagerOverride: true,
    };
  }

  if (isPrimaryOwner) {
    return {
      role: "primary",
      canView: true,
      canEditCompliance: true,
      canUploadDocuments: true,
      canManageCoOwners: true,
      canDispute: false,
      isPrimaryOwner: true,
      isCoPilot: false,
      isManagerOverride: false,
    };
  }

  if (isCoPilot) {
    return {
      role: "co-pilot",
      canView: true,
      canEditCompliance: true,
      canUploadDocuments: true,
      canManageCoOwners: false,
      canDispute: false,
      isPrimaryOwner: false,
      isCoPilot: true,
      isManagerOverride: false,
    };
  }

  const canDispute =
    agency.status === "ASSIGNED" &&
    agency.primaryOwnerId !== null &&
    userRole === "SALES";

  return {
    role: "non-owner",
    canView: true,
    canEditCompliance: false,
    canUploadDocuments: false,
    canManageCoOwners: false,
    canDispute,
    isPrimaryOwner: false,
    isCoPilot: false,
    isManagerOverride: false,
  };
}
