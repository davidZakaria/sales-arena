"use server";

import { revalidatePath } from "next/cache";
import {
  createInboundDraftLead,
  getInboundSystemUser,
} from "@/lib/agency/inbound-lead";

function revalidateInboundPaths() {
  revalidatePath("/operations");
  revalidatePath("/join");
}

export async function submitPublicBrokerForm(data: {
  name: string;
  repPhone1?: string;
  whatsappLink?: string;
  location?: string;
  website?: string;
}) {
  if (data.website?.trim()) {
    return { ok: false as const, error: "Submission rejected." };
  }

  const inboundUser = await getInboundSystemUser();

  try {
    const agency = await createInboundDraftLead({
      name: data.name,
      repPhone1: data.repPhone1,
      whatsappLink: data.whatsappLink,
      location: data.location,
      source: "PUBLIC_PORTAL",
      auditUserId: inboundUser.id,
      auditUserName: inboundUser.name,
      exposeDuplicateDetails: false,
    });

    revalidateInboundPaths();
    return { ok: true as const, agencyId: agency.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed.";
    try {
      const parsed = JSON.parse(message) as { error: string; message: string };
      if (parsed.error === "DUPLICATE") {
        return { ok: false as const, error: parsed.message };
      }
    } catch {
      // not JSON
    }
    return { ok: false as const, error: message };
  }
}
