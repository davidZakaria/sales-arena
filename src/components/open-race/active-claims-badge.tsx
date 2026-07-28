import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MAX_TEMPORARY_CLAIMS } from "@/lib/claims/constants";

type ActiveClaimsBadgeProps = {
  count: number;
};

export function ActiveClaimsBadge({ count }: ActiveClaimsBadgeProps) {
  const atLimit = count >= MAX_TEMPORARY_CLAIMS;

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-3 py-1 text-sm font-medium",
        atLimit
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-blue-200 bg-blue-50 text-blue-800",
      )}
    >
      Active Temporary Claims: {count}/{MAX_TEMPORARY_CLAIMS}
    </Badge>
  );
}
