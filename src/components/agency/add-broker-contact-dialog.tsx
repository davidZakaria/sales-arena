"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrokerContact } from "@/lib/actions/broker-contact";
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

type AddBrokerContactDialogProps = {
  agencyId: string;
  agencyName: string;
};

export function AddBrokerContactDialog({
  agencyId,
  agencyName,
}: AddBrokerContactDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createBrokerContact(agencyId, {
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          role: String(form.get("role") ?? "") || undefined,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add broker contact.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Add Contact
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Broker Contact</DialogTitle>
            <DialogDescription>
              Register an individual broker at {agencyName}. Link EOIs to the broker who brought the client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Broker full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required placeholder="+20 100 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role (optional)</Label>
              <Input id="role" name="role" placeholder="Agent, Team Leader, Owner…" />
            </div>
            {error && (
              <p className="status-danger rounded-lg px-3 py-2 text-sm">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding…" : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
