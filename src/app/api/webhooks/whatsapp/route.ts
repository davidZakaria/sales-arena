import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createInboundDraftLead,
  getInboundSystemUser,
} from "@/lib/agency/inbound-lead";
import { normalizePhone } from "@/lib/agency/normalize-contact";

function normalizeWhatsAppLink(phone: string, whatsappLink?: string): string | null {
  if (whatsappLink?.trim()) return whatsappLink.trim();
  const digits = normalizePhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

async function resolveAgencyIdByPhone(phone: string, agencyId?: string): Promise<string | null> {
  if (agencyId?.trim()) {
    const agency = await prisma.agency.findUnique({ where: { id: agencyId.trim() } });
    return agency?.id ?? null;
  }

  const digits = normalizePhone(phone);
  if (!digits) return null;

  const agencies = await prisma.agency.findMany({
    where: { repPhone1: { not: null } },
    select: { id: true, repPhone1: true, whatsappLink: true },
  });

  for (const agency of agencies) {
    const repDigits = normalizePhone(agency.repPhone1);
    if (repDigits && repDigits === digits) return agency.id;
    const waDigits = agency.whatsappLink?.match(/wa\.me\/(\d+)/i)?.[1];
    if (waDigits && waDigits === digits) return agency.id;
  }

  return null;
}

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type?: string;
    brokerName?: string;
    phone?: string;
    brokerPhone?: string;
    whatsappLink?: string;
    message?: string;
    agencyId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.type === "INQUIRY") {
    const brokerPhone = normalizePhone(body.brokerPhone?.trim() ?? body.phone?.trim());
    const message = body.message?.trim();

    if (!brokerPhone || !message) {
      return NextResponse.json(
        { error: "brokerPhone and message are required for INQUIRY" },
        { status: 400 },
      );
    }

    try {
      const linkedAgencyId = await resolveAgencyIdByPhone(brokerPhone, body.agencyId);
      const inquiry = await prisma.inquiry.create({
        data: {
          brokerPhone,
          rawMessage: message,
          status: "NEW",
          agencyId: linkedAgencyId,
        },
      });

      return NextResponse.json({ ok: true, inquiryId: inquiry.id });
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Failed to create inquiry";
      return NextResponse.json({ error: errMessage }, { status: 500 });
    }
  }

  const brokerName = body.brokerName?.trim();
  const phone = body.phone?.trim();

  if (!brokerName || !phone) {
    return NextResponse.json(
      { error: "brokerName and phone are required" },
      { status: 400 },
    );
  }

  try {
    const inboundUser = await getInboundSystemUser();
    const agency = await createInboundDraftLead({
      name: brokerName,
      repPhone1: phone,
      whatsappLink: normalizeWhatsAppLink(phone, body.whatsappLink),
      source: "WHATSAPP",
      auditUserId: inboundUser.id,
      auditUserName: inboundUser.name,
      inboundNotes: body.message?.trim() || null,
      exposeDuplicateDetails: false,
    });

    return NextResponse.json({ ok: true, agencyId: agency.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create lead";
    try {
      const parsed = JSON.parse(message) as { error: string };
      if (parsed.error === "DUPLICATE") {
        return NextResponse.json({ error: "Duplicate broker" }, { status: 409 });
      }
    } catch {
      // not JSON
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
