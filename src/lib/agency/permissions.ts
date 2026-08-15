import type { AgencyStatus, Role } from "@/generated/prisma/client";
import {
  canSubmitEOI as canSubmitEOIForAgency,
  canViewEOIs as canViewEOIsForAgency,
} from "@/lib/agency/eoi-permissions";
import {
  canManageBrokerContacts as canManageBrokerContactsForAgency,
  canViewBrokerContacts as canViewBrokerContactsForAgency,
} from "@/lib/agency/broker-contact-permissions";

export type AgencyPermissionContext = {
  primaryOwnerId: string | null;
  coOwners: Array<{ id: string }>;
  status: AgencyStatus;
};

export type AgencyPermissionRole =
  | "primary"
  | "co-pilot"
  | "operations"
  | "finance"
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
  canViewEOIs: boolean;
  canSubmitEOI: boolean;
  canViewBrokerContacts: boolean;
  canManageBrokerContacts: boolean;
  isPrimaryOwner: boolean;
  isCoPilot: boolean;
  isManagerOverride: boolean;
  isAuditMode: boolean;
};

const noAccess: Omit<AgencyPermissions, "role" | "isPrimaryOwner" | "isCoPilot" | "isManagerOverride" | "isAuditMode"> = {
  canView: false,
  canEditComplianceFields: false,
  canUploadDocuments: false,
  canManageCoOwners: false,
  canDispute: false,
  canVerifyAgency: false,
  canReturnForRevision: false,
  canViewEOIs: false,
  canSubmitEOI: false,
  canViewBrokerContacts: false,
  canManageBrokerContacts: false,
};

export function getAgencyPermissions(
  agency: AgencyPermissionContext,
  userId: string | undefined,
  userRole: Role | string | undefined,
): AgencyPermissions {
  const isManagerOverride = userRole === "MANAGER" || userRole === "DIRECTOR";
  const isOperations = userRole === "OPERATIONS";
  const isFinance = userRole === "FINANCE";
  const isPrimaryOwner = Boolean(userId && agency.primaryOwnerId === userId);
  const isCoPilot = Boolean(
    userId && agency.coOwners.some((coOwner) => coOwner.id === userId),
  );

  const eoiFlags = {
    canViewEOIs: canViewEOIsForAgency(agency, userId, userRole),
    canSubmitEOI: canSubmitEOIForAgency(agency, userId, userRole),
  };

  const brokerContactFlags = {
    canViewBrokerContacts: canViewBrokerContactsForAgency(agency, userId, userRole),
    canManageBrokerContacts: canManageBrokerContactsForAgency(agency, userId, userRole),
  };

  const base = {
    isPrimaryOwner,
    isCoPilot,
    isManagerOverride: isManagerOverride,
    isAuditMode: isOperations && agency.status === "PENDING_AUDIT",
  };

  if (agency.status === "ARCHIVED") {
    return {
      role: isFinance ? "finance" : isOperations ? "operations" : isManagerOverride ? (userRole === "DIRECTOR" ? "director" : "manager") : isPrimaryOwner ? "primary" : isCoPilot ? "co-pilot" : "non-owner",
      canView: Boolean(userId),
      canEditComplianceFields: false,
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: false,
      canViewEOIs: eoiFlags.canViewEOIs,
      canSubmitEOI: false,
      ...brokerContactFlags,
      canManageBrokerContacts: false,
      ...base,
      isAuditMode: false,
    };
  }

  if (!userId) {
    return {
      role: "non-owner",
      ...noAccess,
      ...base,
    };
  }

  if (isFinance) {
    return {
      role: "finance",
      canView: true,
      canEditComplianceFields: false,
      canUploadDocuments: false,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: false,
      canReturnForRevision: false,
      ...eoiFlags,
      canSubmitEOI: false,
      ...brokerContactFlags,
      canManageBrokerContacts: false,
      ...base,
      isAuditMode: false,
    };
  }

  if (isOperations) {
    const canMaintainAssigned = agency.status === "ASSIGNED";
    const isAudit = agency.status === "PENDING_AUDIT";

    return {
      role: "operations",
      canView: true,
      canEditComplianceFields: canMaintainAssigned || isAudit,
      canUploadDocuments: canMaintainAssigned,
      canManageCoOwners: false,
      canDispute: false,
      canVerifyAgency: isAudit,
      canReturnForRevision: isAudit,
      ...eoiFlags,
      canSubmitEOI: false,
      ...brokerContactFlags,
      canManageBrokerContacts: false,
      ...base,
      isAuditMode: isAudit,
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
      ...eoiFlags,
      canSubmitEOI: false,
      ...brokerContactFlags,
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
      ...eoiFlags,
      ...brokerContactFlags,
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
      ...eoiFlags,
      ...brokerContactFlags,
      ...base,
    };
  }

  const canDispute =
    agency.status === "ASSIGNED" &&
    agency.primaryOwnerId !== null &&
    userRole === "SALES";

  return {
    role: "non-owner",
    canView:
      agency.status !== "OPEN_RACE" && agency.status !== "DRAFT",
    canEditComplianceFields: false,
    canUploadDocuments: false,
    canManageCoOwners: false,
    canDispute,
    canVerifyAgency: false,
    canReturnForRevision: false,
    canViewEOIs: false,
    canSubmitEOI: false,
    canViewBrokerContacts: false,
    canManageBrokerContacts: false,
    ...base,
  };
}

export function canCreateAgency(role: string | undefined): boolean {
  return role === "OPERATIONS";
}

export function canPublishToOpenRace(role: string | undefined): boolean {
  return role === "OPERATIONS";
}

export function canManageInventoryTemplates(role: string | undefined): boolean {
  return role === "MANAGER" || role === "DIRECTOR";
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

export function canAccessFinanceHub(role: string | undefined): boolean {
  return role === "FINANCE";
}

/** @deprecated use canEditComplianceFields */
export function legacyCanEditCompliance(permissions: AgencyPermissions): boolean {
  return permissions.canEditComplianceFields;
}
