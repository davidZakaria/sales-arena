"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimAgency } from "@/lib/actions/agency";
import { CLAIM_SLA_DAYS } from "@/lib/claims/constants";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ClaimAgencyDialogProps = {
  agencyId: string;
  agencyName: string;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
};

export function ClaimAgencyDialog({
  agencyId,
  agencyName,
  disabled = false,
  className,
  fullWidth = false,
}: ClaimAgencyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    setError("");
    startTransition(async () => {
      try {
        await claimAgency(agencyId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim agency.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        disabled={disabled || isPending}
        className={cn(
          "bg-slate-950 hover:bg-slate-800",
          fullWidth && "w-full",
          className,
        )}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {disabled ? "Claim Limit Reached" : isPending ? "Claiming…" : "Claim Agency"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Claim {agencyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to claim {agencyName}? You will have{" "}
              {CLAIM_SLA_DAYS} days to secure the Contract and Tax ID, otherwise
              it will revert to the Open Race market.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              className="bg-slate-950 hover:bg-slate-800"
              onClick={handleClaim}
            >
              {isPending ? "Claiming…" : "Confirm Claim"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
