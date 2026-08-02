import type { InboundSource } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

const sourceStyles: Record<InboundSource, string> = {
  OPERATIONS: "status-neutral",
  PUBLIC_PORTAL: "status-info",
  WHATSAPP: "status-success",
};

const sourceLabels: Record<InboundSource, string> = {
  OPERATIONS: "Ops",
  PUBLIC_PORTAL: "Portal",
  WHATSAPP: "WhatsApp",
};

export function InboundSourceBadge({ source }: { source: InboundSource }) {
  return (
    <Badge variant="outline" className={sourceStyles[source]}>
      {sourceLabels[source]}
    </Badge>
  );
}
