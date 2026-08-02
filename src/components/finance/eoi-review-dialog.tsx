"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertEOI, rejectEOI, verifyEOI } from "@/lib/actions/eoi";
import type { EOIStatus } from "@/generated/prisma/client";
import { EoiStatusBadge } from "@/components/agency/eoi-badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FinanceEoiRow = {
  id: string;
  clientName: string;
  project: string;
  amount: number;
  paymentMethod: string;
  receiptUrl: string | null;
  status: EOIStatus;
  financeNotes: string | null;
  createdAt: Date;
  agency: { id: string; name: string };
  user: { name: string };
  brokerContact: { name: string; role: string | null } | null;
};

type EoiReviewDialogProps = {
  eoi: FinanceEoiRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EoiReviewDialog({ eoi, open, onOpenChange }: EoiReviewDialogProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const pending = eoi.status === "PENDING_FINANCE";
  const canConvert = pending || eoi.status === "VERIFIED";

  function runAction(action: "verify" | "reject" | "convert") {
    setError("");
    startTransition(async () => {
      try {
        if (action === "verify") {
          await verifyEOI(eoi.id);
        } else if (action === "reject") {
          await rejectEOI(eoi.id, notes);
        } else {
          await convertEOI(eoi.id);
        }
        onOpenChange(false);
        setNotes("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review EOI — {eoi.clientName}</DialogTitle>
          <DialogDescription>
            {eoi.agency.name} · submitted by {eoi.user.name}
            {eoi.brokerContact && ` · broker ${eoi.brokerContact.name}`}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Project</dt>
            <dd className="font-medium text-foreground">{eoi.project}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium text-foreground">{eoi.amount.toLocaleString()} EGP</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Broker</dt>
            <dd className="font-medium text-foreground">
              {eoi.brokerContact
                ? `${eoi.brokerContact.name}${eoi.brokerContact.role ? ` (${eoi.brokerContact.role})` : ""}`
                : "Not attributed"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="font-medium text-foreground">{eoi.paymentMethod}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Receipt</dt>
            <dd className="font-medium text-foreground">{eoi.receiptUrl ?? "None"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <EoiStatusBadge status={eoi.status} />
            </dd>
          </div>
        </dl>

        {pending && (
          <div className="space-y-2">
            <Label htmlFor="financeNotes">Rejection notes (required to reject)</Label>
            <Textarea
              id="financeNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Explain why funds were rejected…"
              rows={3}
            />
          </div>
        )}

        {eoi.financeNotes && !pending && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
            Finance notes: {eoi.financeNotes}
          </p>
        )}

        {error && (
          <p className="status-danger rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        )}

        {(pending || canConvert) && (
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {pending && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => runAction("verify")}
                >
                  Verify Funds
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending || !notes.trim()}
                  onClick={() => runAction("reject")}
                >
                  Reject
                </Button>
              </>
            )}
            {canConvert && (
              <Button
                type="button"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90"
                onClick={() => runAction("convert")}
              >
                Convert to Contract
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
