export type AuditActivityKind =
  | "upload"
  | "verify"
  | "submit"
  | "assign"
  | "publish"
  | "eoi"
  | "broker"
  | "team"
  | "dispute"
  | "archive"
  | "import"
  | "inbound"
  | "revision"
  | "other";

export type FormattedAuditAction = {
  kind: AuditActivityKind;
  summary: string;
  detail?: string;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "contract",
  "TAX ID": "tax ID",
  TAX_ID: "tax ID",
  "COMMERCIAL REGISTER": "commercial register",
  COMMERCIAL_REGISTER: "commercial register",
  OTHER: "supporting",
};

function stripActorPrefix(action: string, actorName?: string): string {
  if (!actorName) return action;
  const prefix = `${actorName} `;
  if (action.startsWith(prefix)) {
    return action.slice(prefix.length);
  }
  return action;
}

function formatDocLabel(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/ /g, "_");
  const normalized = raw.trim().toUpperCase();
  return DOC_TYPE_LABELS[normalized] ?? DOC_TYPE_LABELS[key] ?? raw.toLowerCase();
}

function matchPatterns(
  text: string,
): FormattedAuditAction | null {
  const upload = text.match(/^uploaded (.+?): (.+)$/i);
  if (upload) {
    const docLabel = formatDocLabel(upload[1]);
    return {
      kind: "upload",
      summary: `Uploaded a ${docLabel} document`,
      detail: upload[2],
    };
  }

  if (/^submitted all documents for operations audit$/i.test(text)) {
    return {
      kind: "submit",
      summary: "Submitted all compliance documents for Operations review",
    };
  }

  if (/^uploaded contract — status set to contract pending$/i.test(text)) {
    return {
      kind: "upload",
      summary: "Uploaded the signed contract",
      detail: "Agency status updated to Contract Pending",
    };
  }

  if (/^verified compliance data — agency verified$/i.test(text)) {
    return {
      kind: "verify",
      summary: "Approved compliance documents",
      detail: "Agency is now Verified and active",
    };
  }

  const revision = text.match(/^returned agency for revision: (.+)$/i);
  if (revision) {
    return {
      kind: "revision",
      summary: "Sent agency back to sales for revision",
      detail: revision[1],
    };
  }

  if (/^returned agency to sales for revision$/i.test(text)) {
    return {
      kind: "revision",
      summary: "Sent agency back to sales for revision",
    };
  }

  const publish = text.match(/^published (.+?) to open race$/i);
  if (publish) {
    return {
      kind: "publish",
      summary: "Sent lead to manager assignment queue",
      detail: `${publish[1]} is awaiting manager assignment`,
    };
  }

  const sentToManager = text.match(/^sent (.+?) to manager assignment queue$/i);
  if (sentToManager) {
    return {
      kind: "publish",
      summary: "Sent lead to manager assignment queue",
      detail: `${sentToManager[1]} is awaiting manager assignment`,
    };
  }

  const assignLead = text.match(/^assigned lead to (.+)$/i);
  if (assignLead) {
    return {
      kind: "assign",
      summary: `Assigned lead to ${assignLead[1]}`,
    };
  }

  const assign = text.match(/^directly assigned (.+)$/i);
  if (assign) {
    return {
      kind: "assign",
      summary: `Assigned agency to ${assign[1]}`,
    };
  }

  const transfer = text.match(/^transferred ownership to (.+)$/i);
  if (transfer) {
    return {
      kind: "team",
      summary: `Transferred primary ownership to ${transfer[1]}`,
    };
  }

  const coPilotAdded = text.match(/^(.+?) added (.+?) as co-pilot$/i);
  if (coPilotAdded) {
    return {
      kind: "team",
      summary: `Added ${coPilotAdded[2]} as co-pilot`,
      detail: `Primary owner: ${coPilotAdded[1]}`,
    };
  }

  if (/^removed (.+?) as co-pilot$/i.test(text)) {
    const name = text.match(/^removed (.+?) as co-pilot$/i)?.[1];
    return {
      kind: "team",
      summary: `Removed ${name} as co-pilot`,
    };
  }

  const disputeResolved = text.match(
    /^resolved dispute — (.+?) added (.+?) as co-pilot$/i,
  );
  if (disputeResolved) {
    return {
      kind: "dispute",
      summary: "Resolved access dispute",
      detail: `${disputeResolved[1]} added ${disputeResolved[2]} as co-pilot`,
    };
  }

  if (/^rejected the dispute$/i.test(text)) {
    return {
      kind: "dispute",
      summary: "Rejected the access dispute request",
    };
  }

  if (/^filed a dispute \/ request access$/i.test(text)) {
    return {
      kind: "dispute",
      summary: "Filed a dispute / requested access to this agency",
    };
  }

  const archive = text.match(/^archived (.+)$/i);
  if (archive) {
    return {
      kind: "archive",
      summary: `Archived ${archive[1]}`,
    };
  }

  const eoiSubmit = text.match(/^submitted eoi for (.+?) — (.+?) \((.+?)\)(?: via (.+))?$/i);
  if (eoiSubmit) {
    return {
      kind: "eoi",
      summary: `Submitted expression of interest for ${eoiSubmit[1]}`,
      detail: `Project: ${eoiSubmit[2]} · Amount: ${eoiSubmit[3]}${eoiSubmit[4] ? ` · Broker: ${eoiSubmit[4]}` : ""}`,
    };
  }

  if (/^verified eoi funds for (.+)$/i.test(text)) {
    const client = text.match(/^verified eoi funds for (.+)$/i)?.[1];
    return {
      kind: "eoi",
      summary: `Finance verified funds for ${client}`,
      detail: "EOI moved to Verified status",
    };
  }

  const eoiReject = text.match(/^rejected eoi for (.+?): (.+)$/i);
  if (eoiReject) {
    return {
      kind: "eoi",
      summary: `Finance rejected EOI for ${eoiReject[1]}`,
      detail: eoiReject[2],
    };
  }

  if (/^converted eoi for (.+?) to contract$/i.test(text)) {
    const client = text.match(/^converted eoi for (.+?) to contract$/i)?.[1];
    return {
      kind: "eoi",
      summary: `Converted EOI to contract for ${client}`,
    };
  }

  const brokerAdd = text.match(/^added broker contact (.+?)(?: \((.+?)\))?$/i);
  if (brokerAdd) {
    return {
      kind: "broker",
      summary: `Added broker contact ${brokerAdd[1]}`,
      detail: brokerAdd[2] ? `Role: ${brokerAdd[2]}` : undefined,
    };
  }

  const brokerUpdate = text.match(/^updated broker contact (.+?) → (.+)$/i);
  if (brokerUpdate) {
    return {
      kind: "broker",
      summary: `Updated broker contact ${brokerUpdate[1]}`,
      detail: `Renamed to ${brokerUpdate[2]}`,
    };
  }

  if (/^removed broker contact (.+)$/i.test(text)) {
    const name = text.match(/^removed broker contact (.+)$/i)?.[1];
    return {
      kind: "broker",
      summary: `Removed broker contact ${name}`,
    };
  }

  const brokerSelf = text.match(/^broker self-registered via invite link: (.+?)(?: \((.+?)\))?$/i);
  if (brokerSelf) {
    return {
      kind: "broker",
      summary: `${brokerSelf[1]} joined via the broker invite link`,
      detail: brokerSelf[2] ? `Role: ${brokerSelf[2]}` : "Self-registered as a broker contact",
    };
  }

  const bulkImport = text.match(/^bulk-imported (.+?) → assigned \((.+?)\)$/i);
  if (bulkImport) {
    return {
      kind: "import",
      summary: `Imported ${bulkImport[1]} and assigned to ${bulkImport[2]}`,
    };
  }

  if (/^submitted via /i.test(text)) {
    return {
      kind: "inbound",
      summary: "New agency registration received",
      detail: text.replace(/^submitted via /i, "Source: "),
    };
  }

  return null;
}

export function formatAuditAction(
  action: string,
  actorName?: string,
): FormattedAuditAction {
  const stripped = stripActorPrefix(action, actorName);
  const matched = matchPatterns(stripped);

  if (matched) {
    return matched;
  }

  return {
    kind: "other",
    summary: stripped,
  };
}

export function formatActivityTimestamp(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
