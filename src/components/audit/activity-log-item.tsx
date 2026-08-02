import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  RotateCcw,
  Send,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { AuditActivityKind } from "@/lib/audit/format-audit-action";
import {
  formatActivityTimestamp,
  formatAuditAction,
} from "@/lib/audit/format-audit-action";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  AuditActivityKind,
  { icon: typeof Activity; badgeClass: string; label: string }
> = {
  upload: { icon: Upload, badgeClass: "status-info", label: "Document" },
  verify: { icon: CheckCircle2, badgeClass: "status-success", label: "Verified" },
  submit: { icon: Send, badgeClass: "status-violet", label: "Submitted" },
  assign: { icon: UserPlus, badgeClass: "status-violet", label: "Assignment" },
  publish: { icon: Globe, badgeClass: "status-info", label: "Published" },
  eoi: { icon: FileText, badgeClass: "status-warning", label: "EOI" },
  broker: { icon: Users, badgeClass: "status-success", label: "Broker" },
  team: { icon: UserPlus, badgeClass: "status-violet", label: "Team" },
  dispute: { icon: AlertTriangle, badgeClass: "status-warning", label: "Dispute" },
  archive: { icon: Archive, badgeClass: "status-neutral", label: "Archive" },
  import: { icon: Download, badgeClass: "status-info", label: "Import" },
  inbound: { icon: Globe, badgeClass: "status-info", label: "Inbound" },
  revision: { icon: RotateCcw, badgeClass: "status-danger", label: "Revision" },
  other: { icon: Activity, badgeClass: "status-neutral", label: "Activity" },
};

type ActivityLogItemProps = {
  action: string;
  actorName: string;
  createdAt: Date;
  agencyName?: string;
  agencyHref?: string;
  variant?: "feed" | "timeline";
};

export function ActivityLogItem({
  action,
  actorName,
  createdAt,
  agencyName,
  agencyHref,
  variant = "feed",
}: ActivityLogItemProps) {
  const formatted = formatAuditAction(action, actorName);
  const style = KIND_STYLES[formatted.kind];
  const Icon = style.icon;

  if (variant === "timeline") {
    return (
      <li className="relative ml-6">
        <span
          className={cn(
            "absolute top-1.5 -left-[1.65rem] flex h-3 w-3 items-center justify-center rounded-full border-2 border-card ring-1 ring-border",
            style.badgeClass,
          )}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              style.badgeClass,
            )}
          >
            {style.label}
          </span>
          <time className="text-xs text-muted-foreground" title={new Date(createdAt).toLocaleString()}>
            {formatActivityTimestamp(createdAt)}
          </time>
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{formatted.summary}</p>
        {formatted.detail && (
          <p className="mt-0.5 text-sm text-muted-foreground">{formatted.detail}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{actorName}</p>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <div className="flex gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            style.badgeClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {agencyName &&
                (agencyHref ? (
                  <Link href={agencyHref} className="font-medium text-foreground hover:underline">
                    {agencyName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{agencyName}</span>
                ))}
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  style.badgeClass,
                )}
              >
                {style.label}
              </span>
            </div>
            <time
              className="shrink-0 text-xs text-muted-foreground"
              title={new Date(createdAt).toLocaleString()}
            >
              {formatActivityTimestamp(createdAt)}
            </time>
          </div>
          <p className="mt-1 font-medium text-foreground">{formatted.summary}</p>
          {formatted.detail && (
            <p className="mt-0.5 text-muted-foreground">{formatted.detail}</p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">{actorName}</p>
        </div>
      </div>
    </li>
  );
}
