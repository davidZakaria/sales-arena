import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDirectAssign } from "@/lib/agency/permissions";
import { redirectIfSpecialistRole } from "@/lib/navigation/role-home";
import { OpenRaceCard } from "@/components/open-race/open-race-card";

export default async function OpenRacePage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role ?? "";

  await redirectIfSpecialistRole(userRole);

  const [agencies, salesUsers] = await Promise.all([
    prisma.agency.findMany({
      where: { status: "OPEN_RACE" },
      orderBy: { name: "asc" },
    }),
    canDirectAssign(userRole)
      ? prisma.user.findMany({
          where: {
            role: "SALES",
            ...(userRole === "MANAGER" && session?.user?.id
              ? { managerId: session.user.id }
              : {}),
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const t = await getTranslations("openRace");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canDirectAssign(userRole) ? t("subtitleManager") : t("subtitleSales")}
        </p>
      </div>

      {agencies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agencies.map((agency) => (
            <OpenRaceCard
              key={agency.id}
              id={agency.id}
              name={agency.name}
              location={agency.location}
              type={agency.type}
              userRole={userRole}
              salesUsers={salesUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
