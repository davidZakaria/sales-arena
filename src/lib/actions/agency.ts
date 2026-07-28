"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ContractStatus } from "@/generated/prisma/client";
import { createAuditLog, createAuditLogs } from "@/lib/audit/create-audit-log";
import {
  buildComplianceAuditActions,
  canManageCoOwners,
} from "@/lib/agency/ownership";
import { getAgencyPermissions } from "@/lib/agency/permissions";
import { CLAIM_LIMIT_ERROR, MAX_TEMPORARY_CLAIMS } from "@/lib/claims/constants";
import {
  buildClaimExpiry,
  countActiveTemporaryClaims,
  qualifiesForPermanentOwnership,
} from "@/lib/claims/helpers";
import { revertExpiredClaims } from "@/lib/claims/revert-expired-claims";

function revalidateAgencyPaths(agencyId: string) {
  revalidatePath("/open-race");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  revalidatePath("/manager");
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
    include: {
      coOwners: { select: { id: true } },
    },
  });

  if (!existing) {
    throw new Error("Agency not found");
  }

  const permissions = getAgencyPermissions(
    existing,
    session.user.id,
    session.user.role,
  );

  if (!permissions.canEditCompliance) {
    throw new Error("You do not have permission to update compliance data");
  }

  const taxId = data.taxId.trim() || null;
  const commercialRegister = data.commercialRegister.trim() || null;
  const { contractStatus } = data;
  const permanent = qualifiesForPermanentOwnership(taxId, contractStatus);

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
        ...(permanent
          ? {
              claimExpiresAt: null,
              claimedAt: null,
            }
          : {}),
      },
    });

    await createAuditLogs(agencyId, session.user.id, auditActions, tx);
  });

  revalidateAgencyPaths(agencyId);
}

export async function claimAgency(agencyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("Unauthorized");
  }

  await revertExpiredClaims();

  const [agency, activeTemporaryClaims] = await Promise.all([
    prisma.agency.findUnique({ where: { id: agencyId } }),
    countActiveTemporaryClaims(session.user.id),
  ]);

  if (!agency || agency.status !== "OPEN_RACE") {
    throw new Error("Agency is not available to claim");
  }

  if (activeTemporaryClaims >= MAX_TEMPORARY_CLAIMS) {
    throw new Error(CLAIM_LIMIT_ERROR);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        status: "ASSIGNED",
        primaryOwnerId: session.user.id,
        claimedAt: now,
        claimExpiresAt: buildClaimExpiry(now),
        isDisputed: false,
      },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} claimed from Open Race`,
      tx,
    );
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

  if (agency.primaryOwnerId === newUserId) {
    throw new Error("The primary owner cannot be added as a co-pilot");
  }

  if (agency.coOwners.some((coOwner) => coOwner.id === newUserId)) {
    throw new Error("User is already a co-pilot on this agency");
  }

  const newUser = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { id: true, name: true },
  });

  if (!newUser) {
    throw new Error("User not found");
  }

  const primaryName = agency.primaryOwner?.name ?? "Primary owner";

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        coOwners: { connect: { id: newUserId } },
      },
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
    include: {
      coOwners: { select: { id: true, name: true } },
    },
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
      data: {
        coOwners: { disconnect: { id: coOwnerUserId } },
      },
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
    include: {
      coOwners: { select: { id: true } },
    },
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

export { revertExpiredClaims };
