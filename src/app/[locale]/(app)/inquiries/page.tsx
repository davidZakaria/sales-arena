import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getActiveInventoryTemplates,
  getAssignedInquiriesForSales,
} from "@/lib/inquiry/queries";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
import { InquiriesTable } from "@/components/inquiries/inquiries-table";

export default async function InquiriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SALES") {
    redirect("/dashboard");
  }

  await redirectIfSpecialistRole(session.user.role);

  const [inquiries, templates] = await Promise.all([
    getAssignedInquiriesForSales(session.user.id),
    getActiveInventoryTemplates(),
  ]);

  const t = await getTranslations("inquiry");

  const rows = inquiries.map((inquiry) => ({
    id: inquiry.id,
    brokerPhone: inquiry.brokerPhone,
    rawMessage: inquiry.rawMessage,
    createdAt: inquiry.createdAt,
    agencyName: inquiry.agency?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <InquiriesTable inquiries={rows} templates={templates} />
    </div>
  );
}
