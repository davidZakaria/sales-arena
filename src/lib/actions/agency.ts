"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ComplianceDocumentType, ContractStatus } from "@/generated/prisma/client";
import { createAuditLog, createAuditLogs } from "@/lib/audit/create-audit-log";
import {
  buildComplianceAuditActions,
  canManageCoOwners,
} from "@/lib/agency/ownership";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/agency/normalize-contact";
import { getAgencyPermissions, canArchiveAgency } from "@/lib/agency/permissions";

function revalidateAgencyPaths(agencyId: string) {
  revalidatePath("/open-race");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  revalidatePath("/manager");
  revalidatePath("/operations");
  revalidatePath(`/agency/${agencyId}`);
}

export async function updateAgencyCompliance(
  agencyId: string,
  data: {
    commercialRegister: string;
    taxId: string;
    contractStatus: ContractStatus;
  },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { coOwners: { select: { id: true } } },
  });

  if (!existing) {
    throw new Error("Agency not found");
  }

  const permissions = getAgencyPermissions(
    existing,
    session.user.id,
    session.user.role,
  );

  if (!permissions.canEditComplianceFields) {
    throw new Error("You do not have permission to update compliance data");
  }

  if (existing.status === "VERIFIED" && session.user.role !== "MANAGER" && session.user.role !== "DIRECTOR") {
    throw new Error("Verified agencies cannot be edited");
  }

  const taxId = data.taxId.trim() || null;
  const commercialRegister = data.commercialRegister.trim() || null;
  const { contractStatus } = data;

  const auditActions = buildComplianceAuditActions(existing, {
    commercialRegister,
    taxId,
    contractStatus,
  });

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        commercialRegister,
        taxId,
        contractStatus,
      },
    });

    await createAuditLogs(agencyId, session.user.id, auditActions, tx);
  });

  revalidateAgencyPaths(agencyId);
}

export async function uploadComplianceDocument(
  agencyId: string,
  documentType: ComplianceDocumentType,
  fileName: string,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { coOwners: { select: { id: true } } },
  });

  if (!agency) {
    throw new Error("Agency not found");
  }

  const permissions = getAgencyPermissions(
    agency,
    session.user.id,
    session.user.role,
  );

  if (!permissions.canUploadDocuments) {
    throw new Error("You do not have permission to upload documents");
  }

  if (agency.status !== "ASSIGNED") {
    throw new Error("Documents can only be uploaded for assigned agencies");
  }

  const trimmedName = fileName.trim() || `${documentType.toLowerCase()}-upload.pdf`;

  await prisma.$transaction(async (tx) => {
    await tx.complianceDocument.create({
      data: {
        agencyId,
        uploadedById: session.user.id,
        fileName: trimmedName,
        documentType,
      },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} uploaded ${documentType.replace("_", " ")}: ${trimmedName}`,
      tx,
    );

    const docs = await tx.complianceDocument.findMany({
      where: { agencyId },
      select: { documentType: true },
    });

    const types = new Set(docs.map((d) => d.documentType));
    const complete = REQUIRED_DOCUMENT_TYPES.every((t) => types.has(t));

    const agencyUpdate: {
      status?: "PENDING_AUDIT";
      submittedForAuditAt?: Date;
      claimExpiresAt?: null;
      contractStatus?: "PENDING";
    } = {};

    if (documentType === "CONTRACT") {
      agencyUpdate.contractStatus = "PENDING";
    }

    if (complete) {
      agencyUpdate.status = "PENDING_AUDIT";
      agencyUpdate.submittedForAuditAt = new Date();
      agencyUpdate.claimExpiresAt = null;
      if (documentType !== "CONTRACT") {
        agencyUpdate.contractStatus = "PENDING";
      }
    }

    if (Object.keys(agencyUpdate).length > 0) {
      await tx.agency.update({
        where: { id: agencyId },
        data: agencyUpdate,
      });
    }

    if (complete) {
      await createAuditLog(
        agencyId,
        session.user.id,
        `${session.user.name} submitted all documents for Operations audit`,
        tx,
      );
    } else if (documentType === "CONTRACT") {
      await createAuditLog(
        agencyId,
        session.user.id,
        `${session.user.name} uploaded contract — status set to Contract Pending`,
        tx,
      );
    }
  });

  revalidateAgencyPaths(agencyId);
}

export async function addCoOwner(agencyId: string, newUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: {
      primaryOwner: { select: { id: true, name: true } },
      coOwners: { select: { id: true } },
    },
  });

  if (!agency) {
    throw new Error("Agency not found");
  }

  if (!canManageCoOwners(session.user.id, session.user.role, agency)) {
    throw new Error("Only the primary owner or a manager can add co-pilots");
  }

  if (newUserId && agency.primaryOwnerId === newUserId) {
    throw new Error("The primary owner cannot be added as a co-pilot");
  }

  const newUser = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { id: true, name: true, role: true },
  });

  if (!newUser || newUser.role === "OPERATIONS") {
    throw new Error("Invalid co-pilot user");
  }

  if (agency.coOwners.some((coOwner) => coOwner.id === newUserId)) {
    throw new Error("User is already a co-pilot on this agency");
  }

  const primaryName = agency.primaryOwner?.name ?? "Primary owner";

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { coOwners: { connect: { id: newUserId } } },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${primaryName} added ${newUser.name} as Co-Pilot`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}

export async function removeCoOwner(agencyId: string, coOwnerUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { coOwners: { select: { id: true, name: true } } },
  });

  if (!agency) {
    throw new Error("Agency not found");
  }

  if (!canManageCoOwners(session.user.id, session.user.role, agency)) {
    throw new Error("Only the primary owner or a manager can remove co-pilots");
  }

  const coOwner = agency.coOwners.find((user) => user.id === coOwnerUserId);
  if (!coOwner) {
    throw new Error("User is not a co-pilot on this agency");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { coOwners: { disconnect: { id: coOwnerUserId } } },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `Removed ${coOwner.name} as Co-Pilot`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}

export async function fileDispute(agencyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: { coOwners: { select: { id: true } } },
  });

  if (!agency) {
    throw new Error("Agency not found");
  }

  if (agency.status !== "ASSIGNED") {
    throw new Error("Disputes can only be filed on assigned agencies");
  }

  const permissions = getAgencyPermissions(
    agency,
    session.user.id,
    session.user.role,
  );

  if (!permissions.canDispute) {
    throw new Error("You cannot file a dispute for this agency");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { isDisputed: true },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} filed a Dispute / Request Access`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}

export async function archiveAgency(agencyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("Unauthorized");
  }

  if (!canArchiveAgency(session.user.role)) {
    throw new Error("You do not have permission to archive agencies");
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) {
    throw new Error("Agency not found");
  }

  if (agency.status === "ARCHIVED") {
    throw new Error("Agency is already archived");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        status: "ARCHIVED",
        claimExpiresAt: null,
        isDisputed: false,
      },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} archived ${agency.name}`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
  revalidatePath("/operations");
  revalidatePath("/open-race");
}
