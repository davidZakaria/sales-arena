import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PortfolioRoleBadge({ role }: { role: "primary" | "co-pilot" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        role === "primary" ? "status-neutral" : "status-info",
      )}
    >
      Role: {role === "primary" ? "Primary" : "Co-Pilot"}
    </Badge>
  );
}
