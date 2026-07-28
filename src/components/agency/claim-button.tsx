"use client";

import { ClaimAgencyDialog } from "@/components/open-race/claim-agency-dialog";

type ClaimAgencyButtonProps = {
  agencyId: string;
  agencyName: string;
  disabled?: boolean;
};

export function ClaimAgencyButton({
  agencyId,
  agencyName,
  disabled = false,
}: ClaimAgencyButtonProps) {
  return (
    <ClaimAgencyDialog
      agencyId={agencyId}
      agencyName={agencyName}
      disabled={disabled}
    />
  );
}
