"use client";

import { useTranslations } from "next-intl";
import { ActivityLogItem } from "@/components/audit/activity-log-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ActivityLogEntry = {
  id: string;
  action: string;
  createdAt: Date;
  user: {
    name: string;
  };
};

export function ActivityLogTimeline({ logs }: { logs: ActivityLogEntry[] }) {
  const t = useTranslations("agency");
  const tCommon = useTranslations("common");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activityLog")}</CardTitle>
        <CardDescription>{t("activityLogDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tCommon("noActivity")}</p>
        ) : (
          <ol className="relative ms-3 space-y-6 border-s border-border">
            {logs.map((log) => (
              <ActivityLogItem
                key={log.id}
                action={log.action}
                actorName={log.user.name}
                createdAt={log.createdAt}
                variant="timeline"
              />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
