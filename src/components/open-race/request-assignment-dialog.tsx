"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestAssignment } from "@/lib/actions/assignment";
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

type RequestAssignmentDialogProps = {
  agencyId: string;
  agencyName: string;
  pending?: boolean;
  className?: string;
  fullWidth?: boolean;
};

export function RequestAssignmentDialog({
  agencyId,
  agencyName,
  pending = false,
  className,
  fullWidth = false,
}: RequestAssignmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (pending) {
    return (
      <Button
        type="button"
        disabled
        variant="outline"
        className={cn("border-amber-200 text-amber-800", fullWidth && "w-full", className)}
      >
        Requested (Pending Manager)
      </Button>
    );
  }

  function handleRequest() {
    setError("");
    startTransition(async () => {
      try {
        await requestAssignment(agencyId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit request.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        disabled={isPending}
        className={cn("bg-slate-950 hover:bg-slate-800", fullWidth && "w-full", className)}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        {isPending ? "Submitting…" : "Request Assignment"}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Request {agencyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Your manager will review this request and assign the broker to you if approved.
              You will not be assigned until a manager confirms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              className="bg-slate-950 hover:bg-slate-800"
              onClick={handleRequest}
            >
              {isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
