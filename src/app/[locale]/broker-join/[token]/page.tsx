import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrokerSelfRegistrationForm } from "@/components/broker-join/broker-self-registration-form";
import { PublicPageControls } from "@/components/layout/public-page-controls";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = new Set(["ASSIGNED", "VERIFIED"]);

async function getAgencyForInvite(token: string) {
  const agency = await prisma.agency.findUnique({
    where: { brokerInviteToken: token },
    select: { id: true, name: true, status: true },
  });

  if (!agency || !ACTIVE_STATUSES.has(agency.status)) {
    return null;
  }

  return agency;
}

export default async function BrokerJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const agency = await getAgencyForInvite(token);
  const t = await getTranslations("brokerJoin");
  const tCommon = await getTranslations("common");

  if (!agency) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicPageControls />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-lg px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {tCommon("companyName")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {t("title", { agencyName: agency.name })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-6 py-10">
        <BrokerSelfRegistrationForm token={token} agencyName={agency.name} />
      </main>
    </div>
  );
}
