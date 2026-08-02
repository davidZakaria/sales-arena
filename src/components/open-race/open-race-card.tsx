"use client";

import { MapPin } from "lucide-react";
import { TypeBadge, AgencyStatusBadge } from "@/components/agency/badges";
import { DirectAssignSelect } from "@/components/open-race/direct-assign-select";
import { Card, CardContent } from "@/components/ui/card";

type SalesUser = { id: string; name: string; email: string };

type OpenRaceCardProps = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  userRole: string;
  salesUsers: SalesUser[];
};

export function OpenRaceCard({
  id,
  name,
  location,
  type,
  userRole,
  salesUsers,
}: OpenRaceCardProps) {
  const isManager = userRole === "MANAGER" || userRole === "DIRECTOR";
  const isSales = userRole === "SALES";

  return (
    <Card className="transition hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {location ?? "Location TBD"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <AgencyStatusBadge status="OPEN_RACE" />
            <TypeBadge type={type} />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isSales && (
            <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Available for assignment — contact your manager to be assigned this agency.
            </p>
          )}
          {isManager && (
            <DirectAssignSelect agencyId={id} salesUsers={salesUsers} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
