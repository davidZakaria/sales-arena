"use client";

import { MapPin } from "lucide-react";
import { TypeBadge } from "@/components/agency/badges";
import { ClaimAgencyDialog } from "@/components/open-race/claim-agency-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OpenRaceCardProps = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  claimLimitReached: boolean;
};

export function OpenRaceCard({
  id,
  name,
  location,
  type,
  claimLimitReached,
}: OpenRaceCardProps) {
  return (
    <Card className="group relative overflow-hidden border-slate-200 transition hover:border-slate-300 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{name}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {location ?? "Location TBD"}
            </div>
          </div>
          <TypeBadge type={type} />
        </div>
        <div
          className={cn(
            "mt-6 transition",
            claimLimitReached
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
          )}
        >
          <ClaimAgencyDialog
            agencyId={id}
            agencyName={name}
            disabled={claimLimitReached}
            fullWidth
          />
        </div>
      </CardContent>
    </Card>
  );
}
