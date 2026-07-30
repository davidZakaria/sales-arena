"use client";

import { MapPin } from "lucide-react";
import { TypeBadge, AgencyStatusBadge } from "@/components/agency/badges";
import { DirectAssignSelect } from "@/components/open-race/direct-assign-select";
import { RequestAssignmentDialog } from "@/components/open-race/request-assignment-dialog";
import { Card, CardContent } from "@/components/ui/card";

type SalesUser = { id: string; name: string; email: string };

type OpenRaceCardProps = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  userRole: string;
  hasPendingRequest: boolean;
  salesUsers: SalesUser[];
};

export function OpenRaceCard({
  id,
  name,
  location,
  type,
  userRole,
  hasPendingRequest,
  salesUsers,
}: OpenRaceCardProps) {
  const isManager = userRole === "MANAGER" || userRole === "DIRECTOR";
  const isSales = userRole === "SALES";

  return (
    <Card className="border-slate-200 transition hover:border-slate-300 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{name}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
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
            <RequestAssignmentDialog
              agencyId={id}
              agencyName={name}
              pending={hasPendingRequest}
              fullWidth
            />
          )}
          {isManager && (
            <DirectAssignSelect agencyId={id} salesUsers={salesUsers} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
