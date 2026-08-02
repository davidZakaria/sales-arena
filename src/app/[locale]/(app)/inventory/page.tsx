import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInventoryTemplates } from "@/lib/agency/permissions";
import { getActiveInventoryTemplates } from "@/lib/inquiry/queries";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
import { CreateTemplateDialog } from "@/components/inventory/create-template-dialog";
import { InventoryTemplateGrid } from "@/components/inventory/inventory-template-grid";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (
    !session?.user ||
    (role !== "SALES" && role !== "MANAGER" && role !== "DIRECTOR")
  ) {
    redirect("/dashboard");
  }

  await redirectIfSpecialistRole(role);

  const templates = await getActiveInventoryTemplates();
  const t = await getTranslations("inventory");
  const canCreate = canManageInventoryTemplates(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canCreate && <CreateTemplateDialog />}
      </div>

      <InventoryTemplateGrid templates={templates} />
    </div>
  );
}
