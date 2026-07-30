import type { AgencyStatus, Role } from "@/generated/prisma/client";

export type AgencyPermissionContext = {
  primaryOwnerId: string | null;
  coOwners: Array<{ id: string }>;
  status: AgencyStatus;
};

export type AgencyPermissionRole =
  | "primary"
  | "co-pilot"
  | "operations"
  | "manager"
  | "director"
  | "non-owner";

export type AgencyPermissions = {
  role: AgencyPermissionRole;
  canView: boolean;
  canEditComplianceFields: boolean;
  canUploadDocuments: boolean;
  canManageCoOwners: boolean;
  canDispute: boolean;
  canVerifyAgency: boolean;
  canReturnForRevision: boolean;
  isPrimaryOwner: boolean;
  isCoPilot: boolean;
  isManagerOverride: boolean;
  isAuditMode: boolean;
};

export function getAgencyPermissions(
  agency: AgencyPermissionContext,
  userId: string | undefined,
  userRole: Role | string | undefined,
): AgencyPermissions {
  const isManagerOverride = userRole === "MANAGER" || userRole === "DIRECTOR";
  const isOperations = userRole === "OPERATIONS";
  const isPrimaryOwner = Boolean(userId && agency.primaryOwnerId === userId);
  const isCoPilot = Boolean(
    userId && agency.coOwners.some((coOwner) => coOwner.id === userId),
  );

  const base = {
    isPrimaryOwner,
    isCoPilot,
    isManagerOverride: isManagerOverride,
    isAuditMode: isOperations && agency.status === "PENDING_AUDIT",
  };

  if (agency.status === "ARCHIVED") {
    return {
      role: isOperations ? "operations" : isManagerOverride ? (userRole === "DIRECTOR" ? "director" : "manager") : isPrimaryOwner ? "primary" : isCoPilot ? "co-pilot" : "non-owner",
      canView: Boolean(userId),
      canEditComplianceFields: false,
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: false,
      ...base,
      isAuditMode: false,
    };
  }

  if (!userId) {
    return {
      role: "non-owner",
      canView: false,
      canEditComplianceFields: false,
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: false,
      ...base,
    };
  }

  if (isOperations) {
    return {
      role: "operations",
      canView: true,
      canEditComplianceFields: agency.status === "PENDING_AUDIT",
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: agency.status === "PENDING_AUDIT",
      canReturnForRevision: agency.status === "PENDING_AUDIT",
      ...base,
      isAuditMode: agency.status === "PENDING_AUDIT",
    };
  }

  if (isManagerOverride) {
    return {
      role: userRole === "DIRECTOR" ? "director" : "manager",
      canView: true,
      canEditComplianceFields: agency.status !== "VERIFIED",
      canUploadDocuments: true,
      canManageCoOwners: true,
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: agency.status === "PENDING_AUDIT",
      ...base,
    };
  }

  if (isPrimaryOwner) {
    const canUpload =
      agency.status === "ASSIGNED" &&
      userRole === "SALES";

    return {
      role: "primary",
      canView: true,
      canEditComplianceFields: false,
      canUploadDocuments: canUpload,
      canManageCoOwners: agency.status !== "VERIFIED",
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: false,
      ...base,
    };
  }

  if (isCoPilot) {
    return {
      role: "co-pilot",
      canView: true,
      canEditComplianceFields: false,
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: false,
      ...base,
    };
  }

  const canDispute =
    agency.status === "ASSIGNED" &&
    agency.primaryOwnerId !== null &&
    userRole === "SALES";

  return {
    role: "non-owner",
    canView: true,
    canEditComplianceFields: false,
    canUploadDocuments: false,
    canManageCoOwners: false,
    canDispute,
    canVerifyAgency: false,
    canReturnForRevision: false,
    ...base,
  };
}

export function canCreateAgency(role: string | undefined): boolean {
  return role === "OPERATIONS";
}

export function canPublishToOpenRace(role: string | undefined): boolean {
  return role === "OPERATIONS";
}

export function canRequestAssignment(
  role: string | undefined,
  agencyStatus: AgencyStatus,
): boolean {
  return role === "SALES" && agencyStatus === "OPEN_RACE";
}

export function canDirectAssign(role: string | undefined): boolean {
  return role === "MANAGER" || role === "DIRECTOR";
}

export function canManageAssignmentRequests(role: string | undefined): boolean {
  return role === "MANAGER" || role === "DIRECTOR";
}

export function canArchiveAgency(role: string | undefined): boolean {
  return role === "OPERATIONS" || role === "MANAGER" || role === "DIRECTOR";
}

/** @deprecated use canEditComplianceFields */
export function legacyCanEditCompliance(permissions: AgencyPermissions): boolean {
  return permissions.canEditComplianceFields;
}
