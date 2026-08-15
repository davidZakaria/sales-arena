"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AgencyShortCodeLabel({
  shortCode,
  className,
}: {
  shortCode: string | null | undefined;
  className?: string;
}) {
  if (!shortCode) {
    return null;
  }

  return (
    <span className={cn("font-mono text-sm text-muted-foreground", className)}>
      [{shortCode}]
    </span>
  );
}

export function AgencyShortCodeCopyButton({
  shortCode,
}: {
  shortCode: string | null | undefined;
}) {
  const [copied, setCopied] = useState(false);

  if (!shortCode) {
    return null;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shortCode!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      aria-label={`Copy ${shortCode}`}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
