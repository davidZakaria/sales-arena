"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BrokerInviteLinkProps = {
  token: string;
};

export function BrokerInviteLink({ token }: BrokerInviteLinkProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/broker-join/${token}`
      : `/broker-join/${token}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="mt-0.5 rounded-md bg-card p-2 ring-1 ring-border">
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium text-foreground">Broker invite link</p>
            <p className="text-sm text-muted-foreground">
              Share this link so sub-brokers at this agency can add themselves to the directory.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              readOnly
              value={inviteUrl}
              className="min-h-11 bg-card font-mono text-xs text-foreground"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full shrink-0 sm:w-11 sm:px-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">{copied ? "Copied" : "Copy link"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
