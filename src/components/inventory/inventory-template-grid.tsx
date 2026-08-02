"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyTemplateButton } from "@/components/inventory/copy-template-button";

export type InventoryTemplateRow = {
  id: string;
  title: string;
  project: string;
  messageBody: string;
  mediaUrl: string | null;
};

export function InventoryTemplateGrid({ templates }: { templates: InventoryTemplateRow[] }) {
  const t = useTranslations("inventory");

  if (templates.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">{template.title}</CardTitle>
              {template.mediaUrl && (
                <Badge variant="outline" className="shrink-0">
                  {t("pdfBadge")}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {template.project}
            </p>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="line-clamp-5 whitespace-pre-wrap text-sm text-muted-foreground">
              {template.messageBody}
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
            <CopyTemplateButton messageBody={template.messageBody} />
            {template.mediaUrl && (
              <a
                href={template.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                {t("viewMedia")}
              </a>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
