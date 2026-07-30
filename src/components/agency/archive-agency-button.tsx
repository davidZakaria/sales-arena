"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveAgency } from "@/lib/actions/agency";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ArchiveAgencyButtonProps = {
  agencyId: string;
  agencyName: string;
};

export function ArchiveAgencyButton({ agencyId, agencyName }: ArchiveAgencyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    setError("");
    startTransition(async () => {
      try {
        await archiveAgency(agencyId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to archive agency.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Archive Agency
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {agencyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently retires the broker record. It will be removed from Open Race
              and sales portfolios but kept in the system for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleArchive}
            >
              {isPending ? "Archiving…" : "Confirm Archive"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
