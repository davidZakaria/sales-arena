"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit/create-audit-log";
import { canManageBrokerContacts } from "@/lib/agency/broker-contact-permissions";

function revalidateAgencyPaths(agencyId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/manager");
  revalidatePath(`/agency/${agencyId}`);
}

async function requireBrokerContactManager(agencyId: string) {
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
    !canManageBrokerContacts(
      agency,
      session.user.id,
      session.user.role,
    )
  ) {
    throw new Error("You do not have permission to manage broker contacts for this agency");
  }

  return { session, agency };
}

export async function createBrokerContact(
  agencyId: string,
  data: { name: string; phone: string; role?: string },
) {
  const { session } = await requireBrokerContactManager(agencyId);

  const name = data.name.trim();
  const phone = data.phone.trim();
  const role = data.role?.trim() || null;

  if (!name || !phone) {
    throw new Error("Name and phone are required");
  }

  await prisma.$transaction(async (tx) => {
    await tx.brokerContact.create({
      data: { agencyId, name, phone, role },
    });

    await createAuditLog(
      agencyId,
      session.user.id,
      `${session.user.name} added broker contact ${name}${role ? ` (${role})` : ""}`,
      tx,
    );
  });

  revalidateAgencyPaths(agencyId);
}

export async function updateBrokerContact(
  contactId: string,
  data: { name: string; phone: string; role?: string },
) {
  const contact = await prisma.brokerContact.findUnique({
    where: { id: contactId },
    select: { id: true, agencyId: true, name: true },
  });

  if (!contact) {
    throw new Error("Broker contact not found");
  }

  const { session } = await requireBrokerContactManager(contact.agencyId);

  const name = data.name.trim();
  const phone = data.phone.trim();
  const role = data.role?.trim() || null;

  if (!name || !phone) {
    throw new Error("Name and phone are required");
  }

  await prisma.$transaction(async (tx) => {
    await tx.brokerContact.update({
      where: { id: contactId },
      data: { name, phone, role },
    });

    await createAuditLog(
      contact.agencyId,
      session.user.id,
      `${session.user.name} updated broker contact ${contact.name} → ${name}`,
      tx,
    );
  });

  revalidateAgencyPaths(contact.agencyId);
}

export async function deleteBrokerContact(contactId: string) {
  const contact = await prisma.brokerContact.findUnique({
    where: { id: contactId },
    select: { id: true, agencyId: true, name: true },
  });

  if (!contact) {
    throw new Error("Broker contact not found");
  }

  const { session } = await requireBrokerContactManager(contact.agencyId);

  await prisma.$transaction(async (tx) => {
    await tx.brokerContact.delete({ where: { id: contactId } });

    await createAuditLog(
      contact.agencyId,
      session.user.id,
      `${session.user.name} removed broker contact ${contact.name}`,
      tx,
    );
  });

  revalidateAgencyPaths(contact.agencyId);
}

const BROKER_INVITE_STATUSES = new Set(["ASSIGNED", "VERIFIED"]);

export async function registerBrokerViaInvite(
  token: string,
  data: { name: string; phone: string; role?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = data.name.trim();
  const phone = data.phone.trim();
  const role = data.role?.trim() || null;

  if (!name || !phone) {
    return { ok: false, error: "Name and phone are required." };
  }

  const agency = await prisma.agency.findUnique({
    where: { brokerInviteToken: token },
    select: {
      id: true,
      name: true,
      status: true,
      primaryOwnerId: true,
    },
  });

  if (!agency || !BROKER_INVITE_STATUSES.has(agency.status)) {
    return { ok: false, error: "This invite link is invalid or no longer active." };
  }

  const existing = await prisma.brokerContact.findFirst({
    where: { agencyId: agency.id, phone },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      error: "A broker with this phone number is already registered for this agency.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.brokerContact.create({
        data: { agencyId: agency.id, name, phone, role },
      });

      if (agency.primaryOwnerId) {
        await createAuditLog(
          agency.id,
          agency.primaryOwnerId,
          `Broker self-registered via invite link: ${name}${role ? ` (${role})` : ""}`,
          tx,
        );
      }
    });

    revalidateAgencyPaths(agency.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Registration failed. Please try again." };
  }
}
