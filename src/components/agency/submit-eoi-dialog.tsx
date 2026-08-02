"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitEOI } from "@/lib/actions/eoi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BrokerContactOption = {
  id: string;
  name: string;
  role: string | null;
};

type SubmitEoiDialogProps = {
  agencyId: string;
  agencyName: string;
  brokerContacts: BrokerContactOption[];
};

export function SubmitEoiDialog({
  agencyId,
  agencyName,
  brokerContacts,
}: SubmitEoiDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brokerContactId, setBrokerContactId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const requiresBroker = brokerContacts.length > 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (requiresBroker && !brokerContactId) {
      setError("Select the broker who brought this client.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));

    startTransition(async () => {
      try {
        await submitEOI(agencyId, {
          clientName: String(form.get("clientName") ?? ""),
          project: String(form.get("project") ?? ""),
          amount,
          paymentMethod: String(form.get("paymentMethod") ?? ""),
          receiptFileName: String(form.get("receiptFileName") ?? "") || undefined,
          brokerContactId: brokerContactId || undefined,
        });
        setOpen(false);
        setBrokerContactId("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit EOI.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError("");
          setBrokerContactId("");
          setOpen(true);
        }}
      >
        Submit EOI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Expression of Interest</DialogTitle>
          <DialogDescription>
            Record a client EOI for {agencyName}. Finance will verify funds before conversion.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {requiresBroker && (
            <div className="space-y-2">
              <Label>Broker who sourced client</Label>
              <Select
                value={brokerContactId}
                onValueChange={(value) => setBrokerContactId(value ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select broker contact" />
                </SelectTrigger>
                <SelectContent>
                  {brokerContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.role ? ` (${contact.role})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!requiresBroker && (
            <p className="status-warning rounded-lg px-3 py-2 text-sm">
              No broker contacts on file — add contacts in the Broker Contacts tab to attribute EOIs.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input id="clientName" name="clientName" required placeholder="Client full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input id="project" name="project" required placeholder="Project / unit" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (EGP)</Label>
            <Input id="amount" name="amount" type="number" min="1" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Input id="paymentMethod" name="paymentMethod" required placeholder="Bank transfer, cheque, etc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptFileName">Receipt (mock upload)</Label>
            <Input id="receiptFileName" name="receiptFileName" placeholder="receipt.pdf" />
          </div>
          {error && (
            <p className="status-danger rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit for Finance Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
