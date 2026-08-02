"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { registerBrokerViaInvite } from "@/lib/actions/broker-contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BrokerSelfRegistrationFormProps = {
  token: string;
  agencyName: string;
};

export function BrokerSelfRegistrationForm({
  token,
  agencyName,
}: BrokerSelfRegistrationFormProps) {
  const t = useTranslations("brokerJoin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await registerBrokerViaInvite(token, {
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        role: String(formData.get("role") ?? "") || undefined,
      });

      if (result.ok) {
        setSuccess(true);
        return;
      }

      setError(result.error);
    });
  }

  if (success) {
    return (
      <Card className="status-success">
        <CardHeader>
          <CardTitle>{t("successTitle")}</CardTitle>
          <CardDescription>
            {t("successDescription", { agencyName })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("formTitle")}</CardTitle>
        <CardDescription>{t("formDescription", { agencyName })}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("fullName")} *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")} *</Label>
            <Input id="phone" name="phone" required placeholder="+201012345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{t("roleOptional")}</Label>
            <Input id="role" name="role" />
          </div>
          {error && (
            <p className="status-danger rounded-lg px-4 py-3 text-sm">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? t("submitting") : t("register")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
