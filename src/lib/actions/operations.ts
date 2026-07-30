"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import { contactsMatch } from "@/lib/agency/normalize-contact";
import { canCreateAgency, canPublishToOpenRace } from "@/lib/agency/permissions";

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

export type DuplicateAgencyError = {
  error: "DUPLICATE";
  message: string;
  existingAgency: {
    id: string;
    name: string;
    status: string;
    primaryOwnerName: string | null;
    whatsappLink: string | null;
    repPhone1: string | null;
  };
};

export async function findDuplicateAgency(
  repPhone1: string | null,
  whatsappLink: string | null,
  excludeId?: string,
) {
  const agencies = await prisma.agency.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    include: {
      primaryOwner: { select: { name: true } },
    },
  });

  return agencies.find((agency) =>
    contactsMatch(repPhone1, whatsappLink, agency.repPhone1, agency.whatsappLink),
  );
}

export async function createAgencyDraft(data: {
  name: string;
  type?: string;
  location?: string;
  repPhone1?: string;
  whatsappLink?: string;
}) {
  const session = await requireOperations();

  const repPhone1 = data.repPhone1?.trim() || null;
  const whatsappLink = data.whatsappLink?.trim() || null;

  const duplicate = await findDuplicateAgency(repPhone1, whatsappLink);
  if (duplicate) {
    throw new Error(
      JSON.stringify({
        error: "DUPLICATE",
        message: "This broker is already in the system.",
        existingAgency: {
          id: duplicate.id,
          name: duplicate.name,
          status: duplicate.status,
          primaryOwnerName: duplicate.primaryOwner?.name ?? null,
          whatsappLink: duplicate.whatsappLink,
          repPhone1: duplicate.repPhone1,
        },
      } satisfies DuplicateAgencyError),
    );
  }

  const agency = await prisma.agency.create({
    data: {
      name: data.name.trim(),
      type: data.type?.trim() || null,
      location: data.location?.trim() || null,
      repPhone1,
      whatsappLink,
      status: "DRAFT",
      createdById: session.user.id,
      contractStatus: "MISSING",
    },
  });

  await createAuditLog(agency.id, session.user.id, `${session.user.name} created draft lead`);
  revalidateOpsPaths(agency.id);
  return agency.id;
}

export async function publishAgencyToOpenRace(agencyId: string) {
  const session = await requireOperations();
  if (!canPublishToOpenRace(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency || agency.status !== "DRAFT") {
    throw new Error("Agency must be in DRAFT status to publish");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { status: "OPEN_RACE" },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} published ${agency.name} to Open Race`,
      tx,
    );
  });

  revalidateOpsPaths(agencyId);
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

export { canCreateAgency };
