"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";

function revalidateAgencyPaths(agencyId: string) {
  revalidatePath("/manager");
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath(`/agency/${agencyId}`);
}

async function requireManagerSession() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    !session.user.name ||
    (session.user.role !== "MANAGER" && session.user.role !== "DIRECTOR")
  ) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function transferOwnership(agencyId: string, newPrimaryOwnerId: string) {
  const session = await requireManagerSession();

  const [agency, newOwner] = await Promise.all([
    prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        primaryOwner: { select: { name: true } },
        coOwners: { select: { id: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: newPrimaryOwnerId },
      select: { id: true, name: true, role: true },
    }),
  ]);

  if (!agency) {
    throw new Error("Agency not found");
  }

  if (!newOwner || newOwner.role !== "SALES") {
    throw new Error("New owner must be a sales representative");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        primaryOwnerId: newPrimaryOwnerId,
        isDisputed: false,
        coOwners: {
          set: agency.coOwners
            .filter((coOwner) => coOwner.id !== newPrimaryOwnerId)
            .map((coOwner) => ({ id: coOwner.id })),
        },
      },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} transferred ownership to ${newOwner.name}`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}

export async function rejectDispute(agencyId: string) {
  const session = await requireManagerSession();

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) {
    throw new Error("Agency not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { isDisputed: false },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} rejected the dispute`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}

export async function resolveDisputeAddCoPilot(agencyId: string, userId: string) {
  const session = await requireManagerSession();

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: {
      primaryOwner: { select: { name: true } },
      coOwners: { select: { id: true } },
    },
  });

  if (!agency) {
    throw new Error("Agency not found");
  }

  if (agency.primaryOwnerId === userId) {
    throw new Error("User is already the primary owner");
  }

  if (agency.coOwners.some((coOwner) => coOwner.id === userId)) {
    throw new Error("User is already a co-pilot");
  }

  const newCoPilot = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!newCoPilot) {
    throw new Error("User not found");
  }

  const primaryName = agency.primaryOwner?.name ?? "Primary owner";

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        isDisputed: false,
        coOwners: { connect: { id: userId } },
      },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} resolved dispute — ${primaryName} added ${newCoPilot.name} as Co-Pilot`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}
