"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDirectAssign } from "@/lib/agency/permissions";

async function requireManagerSession() {
  const session = await getServerSession(authOptions);
  if (!canDirectAssign(session?.user?.role)) {
    throw new Error("Unauthorized");
  }
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function assignInquiry(inquiryId: string, salesUserId: string) {
  const session = await requireManagerSession();

  const salesUser = await prisma.user.findUnique({
    where: { id: salesUserId },
    select: { id: true, role: true, managerId: true },
  });

  if (!salesUser || salesUser.role !== "SALES") {
    throw new Error("Invalid sales representative");
  }

  if (session.user.role === "MANAGER" && salesUser.managerId !== session.user.id) {
    throw new Error("You can only assign to your direct reports");
  }

  const result = await prisma.inquiry.updateMany({
    where: { id: inquiryId, status: "NEW" },
    data: {
      status: "ASSIGNED",
      assignedSalesId: salesUserId,
    },
  });

  if (result.count === 0) {
    throw new Error("Inquiry is no longer available for assignment");
  }

  revalidatePath("/manager");
  revalidatePath("/inquiries");
}

export async function markInquiryResponded(inquiryId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SALES") {
    throw new Error("Unauthorized");
  }

  const result = await prisma.inquiry.updateMany({
    where: {
      id: inquiryId,
      status: "ASSIGNED",
      assignedSalesId: session.user.id,
    },
    data: { status: "RESPONDED" },
  });

  if (result.count === 0) {
    throw new Error("Inquiry not found or already responded");
  }

  revalidatePath("/inquiries");
  revalidatePath("/manager");
}
