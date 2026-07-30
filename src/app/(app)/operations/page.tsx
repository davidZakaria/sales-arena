import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditQueueTable } from "@/components/operations/audit-queue-table";
import { BulkUploadMock } from "@/components/operations/bulk-upload-mock";
import { CreateLeadForm } from "@/components/operations/create-lead-form";
import { DraftLeadsTable } from "@/components/operations/draft-leads-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function OperationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "OPERATIONS") {
    redirect("/dashboard");
  }

  const [drafts, auditQueue] = await Promise.all([
    prisma.agency.findMany({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, location: true, repPhone1: true, status: true },
    }),
    prisma.agency.findMany({
      where: { status: "PENDING_AUDIT" },
      orderBy: { submittedForAuditAt: "asc" },
      include: { primaryOwner: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Operations Hub
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create broker leads, publish to Open Race, and audit compliance submissions.
        </p>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Lead Creation & Upload</TabsTrigger>
          <TabsTrigger value="audit">
            Audit Queue
            {auditQueue.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {auditQueue.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4 space-y-6">
          <CreateLeadForm />
          <BulkUploadMock />
          <DraftLeadsTable drafts={drafts} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditQueueTable agencies={auditQueue} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
