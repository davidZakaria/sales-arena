"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function CopyTemplateButton({ messageBody }: { messageBody: string }) {
  const t = useTranslations("inventory");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" className="min-h-11 sm:min-h-0" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? t("copied") : t("copyToClipboard")}
    </Button>
  );
}
