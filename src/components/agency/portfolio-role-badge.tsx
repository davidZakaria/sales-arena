import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PortfolioRoleBadge({ role }: { role: "primary" | "co-pilot" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        role === "primary"
          ? "border-slate-300 bg-slate-100 text-slate-800"
          : "border-blue-200 bg-blue-50 text-blue-800",
      )}
    >
      Role: {role === "primary" ? "Primary" : "Co-Pilot"}
    </Badge>
  );
}
