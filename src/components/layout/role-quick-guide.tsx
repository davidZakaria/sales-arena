"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type QuickGuideId = "operations" | "manager" | "sales" | "finance";

export function RoleQuickGuide({ guideId }: { guideId: QuickGuideId }) {
  const t = useTranslations("quickGuide");
  const [open, setOpen] = useState(false);

  const roleName = t(`${guideId}.roleName`);
  const primaryGoal = t(`${guideId}.primaryGoal`);
  const tasks = t.raw(`${guideId}.tasks`) as string[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 shrink-0 text-muted-foreground hover:text-foreground",
        )}
        aria-label={t("openLabel")}
        aria-expanded={open}
      >
        <HelpCircle className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom">
        <div className="space-y-3 text-start">
          <div>
            <p className="text-sm font-semibold leading-snug text-foreground">{roleName}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{primaryGoal}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("tasksHeading")}
            </p>
            <ul className="mt-2 list-disc space-y-2 ps-4 text-sm leading-relaxed text-foreground">
              {tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
