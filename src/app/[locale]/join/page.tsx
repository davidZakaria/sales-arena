import { getTranslations } from "next-intl/server";
import { PublicPageControls } from "@/components/layout/public-page-controls";
import { BrokerRegistrationForm } from "@/components/join/broker-registration-form";

export default async function JoinPage() {
  const t = await getTranslations("join");
  const tCommon = await getTranslations("common");

  return (
    <div className="min-h-screen bg-background">
      <PublicPageControls />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-lg px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {tCommon("companyName")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {t("portalTitle")}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-6 py-10">
        <BrokerRegistrationForm />
      </main>
    </div>
  );
}
