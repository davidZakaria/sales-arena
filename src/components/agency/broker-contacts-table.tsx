"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteBrokerContact, updateBrokerContact } from "@/lib/actions/broker-contact";
import { AddBrokerContactDialog } from "@/components/agency/add-broker-contact-dialog";
import { BrokerInviteLink } from "@/components/agency/broker-invite-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type BrokerContactRow = {
  id: string;
  name: string;
  phone: string;
  role: string | null;
  createdAt: Date;
  _count?: { eois: number };
};

type BrokerContactsTableProps = {
  agencyId: string;
  agencyName: string;
  contacts: BrokerContactRow[];
  canManage: boolean;
  brokerInviteToken?: string;
  showInviteLink?: boolean;
};

export function BrokerContactsTable({
  agencyId,
  agencyName,
  contacts,
  canManage,
  brokerInviteToken,
  showInviteLink = false,
}: BrokerContactsTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<BrokerContactRow | null>(null);
  const [deleting, setDeleting] = useState<BrokerContactRow | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError("");

    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await updateBrokerContact(editing.id, {
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          role: String(form.get("role") ?? "") || undefined,
        });
        setEditing(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update contact.");
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    setError("");

    startTransition(async () => {
      try {
        await deleteBrokerContact(deleting.id);
        setDeleting(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove contact.");
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Broker Contacts</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Individual brokers at this agency. Link EOIs to the broker who sourced the client.
            </p>
          </div>
          {canManage && (
            <AddBrokerContactDialog agencyId={agencyId} agencyName={agencyName} />
          )}
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          {showInviteLink && brokerInviteToken && canManage && (
            <BrokerInviteLink token={brokerInviteToken} />
          )}
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No broker contacts yet.
              {canManage
                ? " Add contacts from this agency's team so EOIs can be attributed to the right broker."
                : ""}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>EOIs</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.role ?? "—"}</TableCell>
                    <TableCell>{contact._count?.eois ?? 0}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setError("");
                              setEditing(contact);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 text-destructive hover:text-destructive sm:h-8 sm:w-8"
                            onClick={() => {
                              setError("");
                              setDeleting(contact);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Broker Contact</DialogTitle>
            <DialogDescription>Update contact details for {editing?.name}.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={editing.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  required
                  defaultValue={editing.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role (optional)</Label>
                <Input
                  id="edit-role"
                  name="role"
                  defaultValue={editing.role ?? ""}
                />
              </div>
              {error && (
                <p className="status-danger rounded-lg px-3 py-2 text-sm">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Broker Contact</DialogTitle>
            <DialogDescription>
              Remove {deleting?.name} from the directory? Linked EOIs will keep their record but
              lose the broker attribution.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="status-danger rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Removing…" : "Remove Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
