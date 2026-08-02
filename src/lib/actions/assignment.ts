"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import { canDirectAssign, canManageAssignmentRequests } from "@/lib/agency/permissions";
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
    throw new Error("Lead is not awaiting manager assignment");
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
      `${session.user.name} assigned lead to ${salesUser.name}`,
      tx,
    );
  });

  revalidateAssignmentPaths(agencyId);
}
