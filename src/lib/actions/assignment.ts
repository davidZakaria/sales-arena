"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import { canDirectAssign, canManageAssignmentRequests, canRequestAssignment } from "@/lib/agency/permissions";
import { buildClaimExpiry } from "@/lib/claims/helpers";

function revalidateAssignmentPaths(agencyId: string) {
  revalidatePath("/open-race");
  revalidatePath("/manager");
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath(`/agency/${agencyId}`);
}

async function requireManagerSession() {
  const session = await getServerSession(authOptions);
  if (!canManageAssignmentRequests(session?.user?.role)) {
    throw new Error("Unauthorized");
  }
  if (!session?.user?.id || !session.user.name) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requestAssignment(agencyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name) {
    throw new Error("Unauthorized");
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency || !canRequestAssignment(session.user.role, agency.status)) {
    throw new Error("Cannot request assignment for this agency");
  }

  const existing = await prisma.assignmentRequest.findFirst({
    where: {
      agencyId,
      userId: session.user.id,
      status: "PENDING",
    },
  });

  if (existing) {
    throw new Error("You already have a pending request for this agency");
  }

  await prisma.$transaction(async (tx) => {
    await tx.assignmentRequest.create({
      data: {
        agencyId,
        userId: session.user.id,
        status: "PENDING",
      },
    });
    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} requested assignment from Open Race`,
      tx,
    );
  });

  revalidateAssignmentPaths(agencyId);
}

export async function approveAssignmentRequest(requestId: string) {
  const session = await requireManagerSession();

  const request = await prisma.assignmentRequest.findUnique({
    where: { id: requestId },
    include: { agency: true, user: true },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Request not found or already processed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.assignmentRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    await tx.agency.update({
      where: { id: request.agencyId },
      data: {
        status: "ASSIGNED",
        primaryOwnerId: request.userId,
        claimExpiresAt: buildClaimExpiry(),
        claimedAt: new Date(),
        isDisputed: false,
      },
    });

    await tx.assignmentRequest.updateMany({
      where: {
        agencyId: request.agencyId,
        status: "PENDING",
        id: { not: requestId },
      },
      data: { status: "REJECTED" },
    });

    await createAuditLog(
      request.agencyId,
      session.user.id,
      `${session.user.name} approved assignment for ${request.user.name} on ${request.agency.name}`,
      tx,
    );
  });

  revalidateAssignmentPaths(request.agencyId);
}

export async function rejectAssignmentRequest(requestId: string) {
  const session = await requireManagerSession();

  const request = await prisma.assignmentRequest.findUnique({
    where: { id: requestId },
    include: { agency: true, user: true },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Request not found or already processed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.assignmentRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
    await createAuditLog(
      request.agencyId,
      session.user.id,
      `${session.user.name} rejected assignment request from ${request.user.name}`,
      tx,
    );
  });

  revalidateAssignmentPaths(request.agencyId);
}

export async function directAssignAgency(agencyId: string, salesUserId: string) {
  const session = await requireManagerSession();
  if (!canDirectAssign(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const [agency, salesUser] = await Promise.all([
    prisma.agency.findUnique({ where: { id: agencyId } }),
    prisma.user.findUnique({
      where: { id: salesUserId },
      select: { id: true, name: true, role: true, managerId: true },
    }),
  ]);

  if (!agency || agency.status !== "OPEN_RACE") {
    throw new Error("Agency is not available for assignment");
  }

  if (!salesUser || salesUser.role !== "SALES") {
    throw new Error("Invalid sales representative");
  }

  if (session.user.role === "MANAGER" && salesUser.managerId !== session.user.id) {
    throw new Error("You can only assign to your direct reports");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: {
        status: "ASSIGNED",
        primaryOwnerId: salesUserId,
        claimExpiresAt: buildClaimExpiry(),
        claimedAt: new Date(),
        isDisputed: false,
      },
    });

    await tx.assignmentRequest.updateMany({
      where: { agencyId, status: "PENDING" },
      data: { status: "REJECTED" },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} directly assigned ${salesUser.name}`,
      tx,
    );
  });

  revalidateAssignmentPaths(agencyId);
}
