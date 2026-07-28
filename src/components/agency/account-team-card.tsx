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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Primary Owner
          </p>
          <p className="mt-1 font-medium text-slate-900">
            👑 {primaryOwner?.name ?? "Unassigned"}
          </p>
          {primaryOwner?.email && (
            <p className="text-xs text-slate-500">{primaryOwner.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Co-Pilots
          </p>
          {coOwners.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-slate-500">
              No co-pilots assigned yet.
            </p>
          ) : (
            coOwners.map((coOwner) => (
              <div
                key={coOwner.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium text-slate-900">🤝 {coOwner.name}</p>
                  <p className="text-xs text-slate-500">{coOwner.email}</p>
                </div>
                {permissions.canManageCoOwners && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-rose-600"
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

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
