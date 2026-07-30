"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createAgencyDraft } from "@/lib/actions/operations";
import { buildBrokerNotifyUrl } from "@/lib/agency/normalize-contact";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DuplicateDetails = {
  name: string;
  status: string;
  primaryOwnerName: string | null;
  whatsappLink: string | null;
  repPhone1: string | null;
};

export function CreateLeadForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<DuplicateDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDuplicate(null);

    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await createAgencyDraft({
          name: String(form.get("name") ?? ""),
          type: String(form.get("type") ?? "") || undefined,
          location: String(form.get("location") ?? "") || undefined,
          repPhone1: String(form.get("repPhone1") ?? "") || undefined,
          whatsappLink: String(form.get("whatsappLink") ?? "") || undefined,
        });
        event.currentTarget.reset();
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create lead.";
        try {
          const parsed = JSON.parse(message) as {
            error: string;
            existingAgency?: DuplicateDetails;
          };
          if (parsed.error === "DUPLICATE" && parsed.existingAgency) {
            setDuplicate(parsed.existingAgency);
            return;
          }
        } catch {
          // not JSON
        }
        setError(message);
      }
    });
  }

  const notifyUrl = duplicate
    ? buildBrokerNotifyUrl(
        duplicate.whatsappLink,
        duplicate.repPhone1,
        duplicate.primaryOwnerName,
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Broker Lead</CardTitle>
        <CardDescription>
          Operations-only. Duplicate phone or WhatsApp numbers are blocked automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Agency Name *</Label>
            <Input id="name" name="name" required placeholder="Broker company name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input id="type" name="type" placeholder="A / B / C" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="City / Area" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repPhone1">Rep Phone</Label>
            <Input id="repPhone1" name="repPhone1" placeholder="+201012345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappLink">WhatsApp Link</Label>
            <Input id="whatsappLink" name="whatsappLink" placeholder="https://wa.me/2010..." />
          </div>
          {duplicate && (
            <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-medium text-amber-950">
                This broker is already in the system.
              </p>
              <p className="mt-1 text-sm text-amber-900">
                {duplicate.name} ({duplicate.status})
                {duplicate.primaryOwnerName
                  ? ` — assigned to ${duplicate.primaryOwnerName}`
                  : " — not yet assigned"}
              </p>
              {notifyUrl ? (
                <a
                  href={notifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-3 inline-flex border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50",
                  )}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Notify Broker
                </a>
              ) : (
                <p className="mt-3 text-xs text-amber-800">
                  No WhatsApp contact on file — cannot generate notify link.
                </p>
              )}
            </div>
          )}
          {error && !duplicate && (
            <p className="sm:col-span-2 text-sm text-rose-600">{error}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending} className="bg-slate-950 hover:bg-slate-800">
              {isPending ? "Creating…" : "Create Draft Lead"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
