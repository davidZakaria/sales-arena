export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function normalizeWhatsApp(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const waMatch = trimmed.match(/wa\.me\/(\d+)/i);
  if (waMatch) return waMatch[1];
  return normalizePhone(trimmed);
}

export function contactsMatch(
  phoneA: string | null | undefined,
  whatsappA: string | null | undefined,
  phoneB: string | null | undefined,
  whatsappB: string | null | undefined,
): boolean {
  const keysA = [normalizePhone(phoneA), normalizeWhatsApp(whatsappA)].filter(Boolean);
  const keysB = [normalizePhone(phoneB), normalizeWhatsApp(whatsappB)].filter(Boolean);
  if (keysA.length === 0 || keysB.length === 0) return false;
  return keysA.some((a) => keysB.some((b) => a === b));
}

export const REQUIRED_DOCUMENT_TYPES = [
  "TAX_ID",
  "COMMERCIAL_REGISTER",
  "CONTRACT",
] as const;

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  text?: string | null,
): string | null {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (text?.trim()) {
    return `${base}?text=${encodeURIComponent(text.trim())}`;
  }
  return base;
}

export function buildBrokerNotifyUrl(
  whatsappLink: string | null | undefined,
  repPhone1: string | null | undefined,
  primaryOwnerName: string | null | undefined,
): string | null {
  const phone = normalizeWhatsApp(whatsappLink) ?? normalizePhone(repPhone1);
  if (!phone) return null;

  const owner = primaryOwnerName ?? "your assigned representative";
  const message = `Hello, your agency is already registered in our system and assigned to ${owner}. They will contact you shortly.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
