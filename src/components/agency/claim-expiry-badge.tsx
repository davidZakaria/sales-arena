import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getDaysRemaining,
  isActiveTemporaryClaim,
} from "@/lib/claims/helpers";

type ClaimExpiryBadgeProps = {
  claimExpiresAt: Date | null;
};

export function ClaimExpiryBadge({ claimExpiresAt }: ClaimExpiryBadgeProps) {
  if (!isActiveTemporaryClaim(claimExpiresAt)) {
    return null;
  }

  const daysRemaining = getDaysRemaining(claimExpiresAt!);
  const urgent = daysRemaining <= 3;

  return (
    <Badge
      variant="outline"
      className={cn(
        urgent
          ? "animate-pulse border-rose-200 bg-rose-100 text-rose-800"
          : "border-amber-200 bg-amber-100 text-amber-800",
      )}
    >
      ⏳ Expires in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}
    </Badge>
  );
}
