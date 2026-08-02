"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FinanceSummaryCardsProps = {
  pendingCount: number;
  pendingAmount: number;
  verifiedCount: number;
  convertedCount: number;
};

export function FinanceSummaryCards({
  pendingCount,
  pendingAmount,
  verifiedCount,
  convertedCount,
}: FinanceSummaryCardsProps) {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const cards = [
    {
      label: t("pendingClearance"),
      value: pendingCount,
      sub: tCommon("egpTotal", { amount: pendingAmount.toLocaleString() }),
      className: "metric-warning",
    },
    {
      label: t("verifiedAwaiting"),
      value: verifiedCount,
      sub: t("verifiedSub"),
      className: "metric-success",
    },
    {
      label: t("converted"),
      value: convertedCount,
      sub: t("convertedSub"),
      className: "metric-violet",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className={card.className}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-current/70">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs opacity-80">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
