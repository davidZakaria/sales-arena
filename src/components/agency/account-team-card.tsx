"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AddCoPilotDialog } from "@/components/agency/add-co-pilot-dialog";
import { DisputeAccessButton } from "@/components/agency/dispute-access-button";
import type { AgencyPermissions } from "@/lib/agency/permissions";
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
  primaryOwner: TeamMember | null;
  coOwners: TeamMember[];
  permissions: AgencyPermissions;
  salesUsers: TeamMember[];
};

export function AccountTeamCard({
  agencyId,
  agencyName,
  primaryOwner,
  coOwners,
  permissions,
  salesUsers,
}: AccountTeamCardProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const existingOwnerIds = [
    primaryOwner?.id,
    ...coOwners.map((coOwner) => coOwner.id),
  ].filter((id): id is string => Boolean(id));

  function handleRemove(coOwnerUserId: string) {
    setError("");
    setRemovingId(coOwnerUserId);
    startTransition(async () => {
      try {
        await removeCoOwner(agencyId, coOwnerUserId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove co-pilot.");
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Account Team</CardTitle>
        {permissions.canManageCoOwners && (
          <AddCoPilotDialog
            agencyId={agencyId}
            salesUsers={salesUsers}
            existingOwnerIds={existingOwnerIds}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Primary Owner
          </p>
          <p className="mt-1 font-medium text-foreground">
            👑 {primaryOwner?.name ?? "Unassigned"}
          </p>
          {primaryOwner?.email && (
            <p className="text-xs text-muted-foreground">{primaryOwner.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Co-Pilots
          </p>
          {coOwners.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-muted-foreground">
              No co-pilots assigned yet.
            </p>
          ) : (
            coOwners.map((coOwner) => (
              <div
                key={coOwner.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <p className="font-medium text-foreground">🤝 {coOwner.name}</p>
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
                    aria-label={`Remove ${coOwner.name} as co-pilot`}
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
