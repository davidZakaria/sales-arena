"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fileDispute } from "@/lib/actions/agency";
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

type DisputeAccessButtonProps = {
  agencyId: string;
  agencyName: string;
};

export function DisputeAccessButton({
  agencyId,
  agencyName,
}: DisputeAccessButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDispute() {
    setError("");
    startTransition(async () => {
      try {
        await fileDispute(agencyId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to file dispute.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-rose-200 text-rose-700 hover:bg-rose-50"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Request Co-Pilot / Dispute
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Request access to {agencyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will alert your Sales Manager that you have been working with
              this broker and believe you should share ownership. They can add
              you as a Co-Pilot or transfer ownership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleDispute}
            >
              {isPending ? "Submitting…" : "Submit Dispute"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
