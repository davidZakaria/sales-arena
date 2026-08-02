import { NextResponse } from "next/server";
import {
  createInboundDraftLead,
  getInboundSystemUser,
} from "@/lib/agency/inbound-lead";

function normalizeWhatsAppLink(phone: string, whatsappLink?: string): string | null {
  if (whatsappLink?.trim()) return whatsappLink.trim();
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
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
    brokerName?: string;
    phone?: string;
    whatsappLink?: string;
    message?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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
