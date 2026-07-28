import Link from "next/link";
import { getServerSession } from "next-auth";
import { MessageCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userAgencyAccessFilter } from "@/lib/agency/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContractStatusBadge } from "@/components/agency/badges";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const [assignedCount, openRaceCount, missingContracts, missingDocs, myAgencies] =
    await Promise.all([
      userId
        ? prisma.agency.count({
            where: { status: "ASSIGNED", ...userAgencyAccessFilter(userId) },
          })
        : Promise.resolve(0),
      prisma.agency.count({ where: { status: "OPEN_RACE" } }),
      userId
        ? prisma.agency.count({
            where: {
              ...userAgencyAccessFilter(userId),
              contractStatus: { in: ["MISSING", "PENDING"] },
            },
          })
        : Promise.resolve(0),
      userId
        ? prisma.agency.count({
            where: {
              AND: [
                userAgencyAccessFilter(userId),
                { OR: [{ taxId: null }, { commercialRegister: null }] },
              ],
            },
          })
        : Promise.resolve(0),
      userId
        ? prisma.agency.findMany({
            where: userAgencyAccessFilter(userId),
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
    ]);

  const actionItems = myAgencies.filter(
    (agency) =>
      !agency.taxId ||
      !agency.commercialRegister ||
      agency.contractStatus === "MISSING",
  );

  const metrics = [
    {
      label: "Total Assigned Agencies",
      value: assignedCount,
      className: "border-slate-200 bg-white",
    },
    {
      label: "Open Race Available",
      value: openRaceCount,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    },
    {
      label: "Missing Contracts",
      value: missingContracts,
      className: "border-rose-200 bg-rose-50 text-rose-900",
    },
    {
      label: "Missing Tax ID / CR",
      value: missingDocs,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Compliance overview for {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className={metric.className}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-current/70">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Needs Immediate Action</CardTitle>
        </CardHeader>
        <CardContent>
          {actionItems.length === 0 ? (
            <p className="text-sm text-slate-500">
              All assigned agencies have complete compliance data.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionItems.map((agency) => {
                  const missing: string[] = [];
                  if (!agency.taxId) missing.push("Tax ID");
                  if (!agency.commercialRegister) missing.push("CR");
                  if (agency.contractStatus === "MISSING") missing.push("Contract");

                  return (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <Link
                          href={`/agency/${agency.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {agency.name}
                        </Link>
                        <p className="text-xs text-slate-500">{agency.location}</p>
                      </TableCell>
                      <TableCell className="text-amber-700">{missing.join(", ")}</TableCell>
                      <TableCell>
                        <ContractStatusBadge status={agency.contractStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        {agency.whatsappLink ? (
                          <Link
                            href={agency.whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">No link</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
