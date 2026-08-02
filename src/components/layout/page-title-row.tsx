import type { ReactNode } from "react";
import { RoleQuickGuide, type QuickGuideId } from "@/components/layout/role-quick-guide";
import { cn } from "@/lib/utils";

export function PageTitleRow({
  title,
  subtitle,
  guideId,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  guideId?: QuickGuideId;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {guideId && <RoleQuickGuide guideId={guideId} />}
        </div>
        {subtitle && (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
