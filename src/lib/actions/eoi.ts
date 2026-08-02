"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import {
  canSubmitEOI,
  canVerifyEOI,
  canRejectEOI,
  canConvertEOI,
} from "@/lib/agency/eoi-permissions";

function revalidateEoiPaths(agencyId: string) {
  revalidatePath("/finance");
  revalidatePath(`/agency/${agencyId}`);
  revalidatePath("/dashboard");
}

async function requireFinance() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.name || session.user.role !== "FINANCE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function submitEOI(
  agencyId: string,
  data: {
    clientName: string;
    project: string;
    amount: number;
    paymentMethod: string;
    receiptFileName?: string;
    brokerContactId?: string;
  },
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

  if (
    !canSubmitEOI(
      agency,
      session.user.id,
      session.user.role,
    )
  ) {
    throw new Error("You do not have permission to submit an EOI for this agency");
  }

  const clientName = data.clientName.trim();
  const project = data.project.trim();
  const paymentMethod = data.paymentMethod.trim();

  if (!clientName || !project || !paymentMethod || data.amount <= 0) {
    throw new Error("All EOI fields are required and amount must be positive");
  }

  const receiptUrl = data.receiptFileName
    ? `mock://receipts/${data.receiptFileName.trim()}`
    : null;

  let brokerContactId: string | null = null;
  let brokerContactName: string | null = null;
  if (data.brokerContactId) {
    const contact = await prisma.brokerContact.findFirst({
      where: { id: data.brokerContactId, agencyId },
      select: { id: true, name: true },
    });
    if (!contact) {
      throw new Error("Selected broker contact is not valid for this agency");
    }
    brokerContactId = contact.id;
    brokerContactName = contact.name;
  }

  await prisma.$transaction(async (tx) => {
    await tx.eOI.create({
      data: {
        agencyId,
        userId: session.user.id,
        brokerContactId,
        clientName,
        project,
        amount: data.amount,
        paymentMethod,
        receiptUrl,
        status: "PENDING_FINANCE",
      },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} submitted EOI for ${clientName} — ${project} (${data.amount})${brokerContactName ? ` via ${brokerContactName}` : ""}`,
      tx,
    );
  });

  revalidateEoiPaths(agencyId);
}

export async function verifyEOI(eoiId: string) {
  const session = await requireFinance();
  if (!canVerifyEOI(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const eoi = await prisma.eOI.findUnique({ where: { id: eoiId } });
  if (!eoi || eoi.status !== "PENDING_FINANCE") {
    throw new Error("EOI is not pending finance review");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eOI.update({
      where: { id: eoiId },
      data: { status: "VERIFIED", financeNotes: null },
    });
    await createAuditLog(
      eoi.agencyId,
      session.user.id,
      `${session.user.name} verified EOI funds for ${eoi.clientName}`,
      tx,
    );
  });

  revalidateEoiPaths(eoi.agencyId);
}

export async function rejectEOI(eoiId: string, financeNotes: string) {
  const session = await requireFinance();
  if (!canRejectEOI(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const notes = financeNotes.trim();
  if (!notes) {
    throw new Error("Finance notes are required when rejecting an EOI");
  }

  const eoi = await prisma.eOI.findUnique({ where: { id: eoiId } });
  if (!eoi || eoi.status !== "PENDING_FINANCE") {
    throw new Error("EOI is not pending finance review");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eOI.update({
      where: { id: eoiId },
      data: { status: "REJECTED", financeNotes: notes },
    });
    await createAuditLog(
      eoi.agencyId,
      session.user.id,
      `${session.user.name} rejected EOI for ${eoi.clientName}: ${notes}`,
      tx,
    );
  });

  revalidateEoiPaths(eoi.agencyId);
}

export async function convertEOI(eoiId: string) {
  const session = await requireFinance();
  if (!canConvertEOI(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const eoi = await prisma.eOI.findUnique({ where: { id: eoiId } });
  if (!eoi || (eoi.status !== "PENDING_FINANCE" && eoi.status !== "VERIFIED")) {
    throw new Error("EOI is not eligible for conversion");
  }

  await prisma.$transaction(async (tx) => {
    await tx.eOI.update({
      where: { id: eoiId },
      data: { status: "CONVERTED" },
    });
    await tx.agency.update({
      where: { id: eoi.agencyId },
      data: { contractStatus: "SIGNED" },
    });
    await createAuditLog(
      eoi.agencyId,
      session.user.id,
      `${session.user.name} converted EOI for ${eoi.clientName} to contract`,
      tx,
    );
  });

  revalidateEoiPaths(eoi.agencyId);
}
