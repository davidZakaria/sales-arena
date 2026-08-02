"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createInventoryTemplate } from "@/lib/actions/inventory-template";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export function CreateTemplateDialog() {
  const t = useTranslations("inventory");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createInventoryTemplate({
          title: String(formData.get("title") ?? ""),
          project: String(formData.get("project") ?? ""),
          messageBody: String(formData.get("messageBody") ?? ""),
          mediaUrl: String(formData.get("mediaUrl") ?? "") || null,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("createFailed"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="min-h-11" />}>
        <Plus className="h-4 w-4" />
        {t("createTemplate")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createTemplate")}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("titleLabel")}</Label>
            <Input id="title" name="title" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">{t("projectLabel")}</Label>
            <Input id="project" name="project" required disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="messageBody">{t("messageLabel")}</Label>
            <Textarea
              id="messageBody"
              name="messageBody"
              rows={6}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mediaUrl">{t("mediaUrlLabel")}</Label>
            <Input
              id="mediaUrl"
              name="mediaUrl"
              placeholder="https://..."
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="min-h-11">
              {isPending ? t("saving") : t("saveTemplate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
