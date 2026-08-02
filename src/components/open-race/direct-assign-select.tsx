"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { directAssignAgency } from "@/lib/actions/assignment";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SalesUser = { id: string; name: string; email: string };

type DirectAssignSelectProps = {
  agencyId: string;
  salesUsers: SalesUser[];
};

export function DirectAssignSelect({ agencyId, salesUsers }: DirectAssignSelectProps) {
  const router = useRouter();
  const t = useTranslations("manager");
  const [isPending, startTransition] = useTransition();

  function handleAssign(userId: string | null) {
    if (!userId) return;
    startTransition(async () => {
      await directAssignAgency(agencyId, userId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{t("assignToRep")}</Label>
      <Select disabled={isPending || salesUsers.length === 0} onValueChange={handleAssign}>
        <SelectTrigger className="min-h-11 sm:h-9">
          <SelectValue placeholder={t("selectRep")} />
        </SelectTrigger>
        <SelectContent>
          {salesUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {salesUsers.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("noEligibleReps")}</p>
      )}
    </div>
  );
}
