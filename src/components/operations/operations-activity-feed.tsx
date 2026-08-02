import { getTranslations } from "next-intl/server";
import type { OperationsActivityRow } from "@/lib/operations/queries";
import { ActivityLogItem } from "@/components/audit/activity-log-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function OperationsActivityFeed({
  activity,
}: {
  activity: OperationsActivityRow[];
}) {
  const t = await getTranslations("operations");
  const tCommon = await getTranslations("common");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentActivity")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("recentActivityDescription")}</p>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tCommon("noActivity")}</p>
        ) : (
          <ul className="max-h-96 space-y-3 overflow-y-auto pe-1">
            {activity.map((entry) => (
              <ActivityLogItem
                key={entry.id}
                action={entry.action}
                actorName={entry.user.name}
                createdAt={entry.createdAt}
                agencyName={entry.agency.name}
                agencyHref={`/agency/${entry.agency.id}`}
                variant="feed"
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
