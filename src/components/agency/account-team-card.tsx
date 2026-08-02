"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { AgencyStatus } from "@/generated/prisma/client";
import { AddCoPilotDialog } from "@/components/agency/add-co-pilot-dialog";
import { DisputeAccessButton } from "@/components/agency/dispute-access-button";
import { DirectAssignSelect } from "@/components/open-race/direct-assign-select";
import type { AgencyPermissions } from "@/lib/agency/permissions";
import { canDirectAssign } from "@/lib/agency/permissions";
import { removeCoOwner } from "@/lib/actions/agency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TeamMember = {
  id: string;
  name: string;
  email: string;
};

type AccountTeamCardProps = {
  agencyId: string;
  agencyName: string;
  agencyStatus: AgencyStatus;
  primaryOwner: TeamMember | null;
  manager: TeamMember | null;
  director: TeamMember | null;
  coOwners: TeamMember[];
  permissions: AgencyPermissions;
  salesUsers: TeamMember[];
  viewerRole?: string;
};

export function AccountTeamCard({
  agencyId,
  agencyName,
  agencyStatus,
  primaryOwner,
  manager,
  director,
  coOwners,
  permissions,
  salesUsers,
  viewerRole,
}: AccountTeamCardProps) {
  const router = useRouter();
  const t = useTranslations("agency");
  const tTerm = useTranslations("terminology");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const existingOwnerIds = [
    primaryOwner?.id,
    ...coOwners.map((coOwner) => coOwner.id),
  ].filter((id): id is string => Boolean(id));

  const showInlineAssign =
    agencyStatus === "OPEN_RACE" && canDirectAssign(viewerRole);

  function handleRemove(coOwnerUserId: string) {
    setError("");
    setRemovingId(coOwnerUserId);
    startTransition(async () => {
      try {
        await removeCoOwner(agencyId, coOwnerUserId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("removeCoPilotFailed"));
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t("accountTeam")}</CardTitle>
        {permissions.canManageCoOwners && (
          <AddCoPilotDialog
            agencyId={agencyId}
            salesUsers={salesUsers}
            existingOwnerIds={existingOwnerIds}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {showInlineAssign && (
          <div className="rounded-lg border border-info/30 bg-info/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("assignLead")}
            </p>
            <DirectAssignSelect agencyId={agencyId} salesUsers={salesUsers} />
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {tTerm("primaryOwner")}
          </p>
          <p className="mt-1 font-medium text-foreground">
            {primaryOwner?.name ?? t("unassignedRep")}
          </p>
          {primaryOwner?.email && (
            <p className="text-xs text-muted-foreground">{primaryOwner.email}</p>
          )}
        </div>

        {(manager || director) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("reportingManager")}
              </p>
              <p className="mt-1 font-medium text-foreground">{manager?.name ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("reportingDirector")}
              </p>
              <p className="mt-1 font-medium text-foreground">{director?.name ?? "—"}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {tTerm("coPilots")}
          </p>
          {coOwners.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-muted-foreground">
              {t("noCoPilots")}
            </p>
          ) : (
            coOwners.map((coOwner) => (
              <div
                key={coOwner.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{coOwner.name}</p>
                  <p className="text-xs text-muted-foreground">{coOwner.email}</p>
                </div>
                {permissions.canManageCoOwners && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
                    disabled={isPending && removingId === coOwner.id}
                    onClick={() => handleRemove(coOwner.id)}
                    aria-label={t("removeCoPilot", { name: coOwner.name })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {permissions.canDispute && (
          <DisputeAccessButton agencyId={agencyId} agencyName={agencyName} />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
