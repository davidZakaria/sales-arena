"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import { contactsMatch } from "@/lib/agency/normalize-contact";
import {
  createInboundDraftLead,
  type DuplicateAgencyError,
} from "@/lib/agency/inbound-lead";

function revalidateOpsPaths(agencyId?: string) {
  revalidatePath("/operations");
  revalidatePath("/open-race");
  revalidatePath("/dashboard");
  if (agencyId) revalidatePath(`/agency/${agencyId}`);
}

async function requireOperations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "OPERATIONS") {
    throw new Error("Unauthorized");
  }
  return session;
}

import {
  normalizeBulkImportRows,
} from "@/lib/agency/bulk-import";
import { canCreateAgency, canPublishToOpenRace } from "@/lib/agency/permissions";
import { findDuplicateAgency } from "@/lib/agency/inbound-lead";

export type { DuplicateAgencyError };
export { findDuplicateAgency };

export async function createAgencyDraft(data: {
  name: string;
  type?: string;
  location?: string;
  repPhone1?: string;
  whatsappLink?: string;
}) {
  const session = await requireOperations();

  const agency = await createInboundDraftLead({
    name: data.name,
    type: data.type,
    location: data.location,
    repPhone1: data.repPhone1,
    whatsappLink: data.whatsappLink,
    source: "OPERATIONS",
    createdById: session.user.id,
    auditUserId: session.user.id,
    auditUserName: session.user.name ?? "Operations",
    exposeDuplicateDetails: true,
  });

  revalidateOpsPaths(agency.id);
  return agency.id;
}

export async function publishAgencyToOpenRace(agencyId: string) {
  return sendLeadToManager(agencyId);
}

/** Ops releases a vetted lead to the manager assignment queue (OPEN_RACE status). */
export async function sendLeadToManager(agencyId: string) {
  const session = await requireOperations();
  if (!canPublishToOpenRace(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency || agency.status !== "DRAFT") {
    throw new Error("Lead must be in DRAFT status to send to manager");
  }

  if (!agency.name?.trim() || !agency.repPhone1?.trim()) {
    throw new Error("Lead name and phone are required before sending to manager");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { status: "OPEN_RACE" },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} sent ${agency.name} to manager assignment queue`,
      tx,
    );
  });

  revalidateOpsPaths(agencyId);
  revalidatePath("/manager");
}

export async function verifyAgencyCompliance(
  agencyId: string,
  data: { commercialRegister: string; taxId: string; contractStatus: "SIGNED" },
) {
  const session = await requireOperations();

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency || agency.status !== "PENDING_AUDIT") {
    throw new Error("Agency is not pending audit");
  }

  const commercialRegister = data.commercialRegister.trim();
  const taxId = data.taxId.trim();
  if (!commercialRegister || !taxId) {
    throw new Error("Commercial Register and Tax ID are required");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        commercialRegister,
        taxId,
        contractStatus: "SIGNED",
        status: "VERIFIED",
        submittedForAuditAt: null,
        claimExpiresAt: null,
        claimedAt: null,
      },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} verified compliance data — agency VERIFIED`,
      tx,
    );
  });

  revalidateOpsPaths(agencyId);
}

export async function returnAgencyForRevision(agencyId: string, reason?: string) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    (session.user.role !== "OPERATIONS" &&
      session.user.role !== "MANAGER" &&
      session.user.role !== "DIRECTOR")
  ) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency || agency.status !== "PENDING_AUDIT") {
    throw new Error("Agency is not pending audit");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        status: "ASSIGNED",
        submittedForAuditAt: null,
      },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      reason
        ? `${session.user.name} returned agency for revision: ${reason}`
        : `${session.user.name} returned agency to Sales for revision`,
      tx,
    );
  });

  revalidateOpsPaths(agencyId);
}

export type BulkImportResult = {
  imported: number;
  skipped: number;
  skippedDuplicates: string[];
  skippedInvalid: number;
};

export async function bulkImportAgencies(
  rows: Record<string, unknown>[],
): Promise<BulkImportResult> {
  const session = await requireOperations();
  const normalizedRows = normalizeBulkImportRows(rows);

  const existingAgencies = await prisma.agency.findMany({
    select: { repPhone1: true, whatsappLink: true },
  });

  function isDuplicateInDb(repPhone1: string | null, whatsappLink: string | null): boolean {
    return existingAgencies.some((agency) =>
      contactsMatch(repPhone1, whatsappLink, agency.repPhone1, agency.whatsappLink),
    );
  }

  function isDuplicateInBatch(
    repPhone1: string | null,
    whatsappLink: string | null,
    batchKeys: Set<string>,
  ): boolean {
    const keys = [repPhone1, whatsappLink].filter(Boolean) as string[];
    return keys.some((key) => batchKeys.has(key.replace(/\D/g, "") || key));
  }

  function trackBatchKeys(
    repPhone1: string | null,
    whatsappLink: string | null,
    batchKeys: Set<string>,
  ) {
    if (repPhone1) batchKeys.add(repPhone1.replace(/\D/g, ""));
    if (whatsappLink) {
      const match = whatsappLink.match(/wa\.me\/(\d+)/i);
      if (match) batchKeys.add(match[1]);
      batchKeys.add(whatsappLink.replace(/\D/g, ""));
    }
  }

  let imported = 0;
  let skipped = 0;
  const skippedDuplicates: string[] = [];
  const batchKeys = new Set<string>();

  for (const row of normalizedRows) {
    if (
      isDuplicateInDb(row.repPhone1, row.whatsappLink) ||
      isDuplicateInBatch(row.repPhone1, row.whatsappLink, batchKeys)
    ) {
      skipped += 1;
      skippedDuplicates.push(row.name);
      continue;
    }

    const agency = await prisma.agency.create({
      data: {
        name: row.name.trim(),
        type: row.type,
        location: row.location,
        repPhone1: row.repPhone1,
        whatsappLink: row.whatsappLink,
        status: "DRAFT",
        source: "OPERATIONS",
        createdById: session.user.id,
        contractStatus: "MISSING",
      },
    });

    await createAuditLog(
      agency.id,
      session.user.id,
      `${session.user.name} bulk-imported ${row.name} (DRAFT — send to manager when ready)`,
    );

    existingAgencies.push({
      repPhone1: row.repPhone1,
      whatsappLink: row.whatsappLink,
    });
    trackBatchKeys(row.repPhone1, row.whatsappLink, batchKeys);
    imported += 1;
  }

  revalidateOpsPaths();

  return {
    imported,
    skipped,
    skippedDuplicates,
    skippedInvalid: rows.length - normalizedRows.length,
  };
}

export { canCreateAgency };
