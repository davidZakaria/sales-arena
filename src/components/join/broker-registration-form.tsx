"use client";

import { useState, useTransition } from "react";
import { submitPublicBrokerForm } from "@/lib/actions/inbound";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrokerRegistrationForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitPublicBrokerForm({
        name: String(formData.get("name") ?? ""),
        repPhone1: String(formData.get("repPhone1") ?? "") || undefined,
        whatsappLink: String(formData.get("whatsappLink") ?? "") || undefined,
        location: String(formData.get("location") ?? "") || undefined,
        website: String(formData.get("website") ?? "") || undefined,
      });

      if (result.ok) {
        setSuccess(true);
        return;
      }

      setError(result.error ?? "Registration failed.");
    });
  }

  if (success) {
    return (
      <Card className="status-success">
        <CardHeader>
          <CardTitle>Registration received</CardTitle>
          <CardDescription>
            Thank you for registering. Our Operations team will review your details and contact you shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => setSuccess(false)}>
            Submit another agency
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broker Registration</CardTitle>
        <CardDescription>
          Register your agency to partner with New Jersey Developments. All submissions are reviewed by our Operations team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="hidden sm:col-span-2" aria-hidden="true">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Agency Name *</Label>
            <Input id="name" name="name" required placeholder="Your brokerage company name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repPhone1">Rep Phone *</Label>
            <Input id="repPhone1" name="repPhone1" required placeholder="+201012345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappLink">WhatsApp Link</Label>
            <Input id="whatsappLink" name="whatsappLink" placeholder="https://wa.me/2010..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="City / Area" />
          </div>
          {error && (
            <p className="status-danger rounded-lg px-4 py-3 text-sm sm:col-span-2">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="min-h-11 sm:col-span-2">
            {isPending ? "Submitting…" : "Register Agency"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
