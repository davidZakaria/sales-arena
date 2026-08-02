"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCoOwner } from "@/lib/actions/agency";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SalesUser = {
  id: string;
  name: string;
  email: string;
};

type AddCoPilotDialogProps = {
  agencyId: string;
  salesUsers: SalesUser[];
  existingOwnerIds: string[];
};

export function AddCoPilotDialog({
  agencyId,
  salesUsers,
  existingOwnerIds,
}: AddCoPilotDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const eligibleUsers = salesUsers.filter(
    (user) => !existingOwnerIds.includes(user.id),
  );

  function handleAdd() {
    if (!selectedUserId) {
      setError("Select a sales rep to add as co-pilot.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        await addCoOwner(agencyId, selectedUserId);
        setOpen(false);
        setSelectedUserId("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add co-pilot.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={eligibleUsers.length === 0}
        onClick={() => setOpen(true)}
      >
        Add Co-Pilot
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Co-Pilot</DialogTitle>
            <DialogDescription>
              Share ownership with another sales rep. Both reps share the 14-day
              compliance clock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Sales representative</Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => setSelectedUserId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sales rep" />
              </SelectTrigger>
              <SelectContent>
                {eligibleUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={handleAdd}>
              {isPending ? "Adding…" : "Add Co-Pilot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
