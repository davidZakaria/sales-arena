import Link from "next/link";
import type { BrokerEoiStatRow } from "@/lib/agency/eoi-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BrokerEoiPerformanceTable({
  rows,
}: {
  rows: BrokerEoiStatRow[];
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broker EOI Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No broker-attributed EOIs yet. Once sales reps link EOIs to broker contacts on agency
            profiles, performance rolls up here by individual broker.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broker EOI Performance</CardTitle>
        <p className="text-sm text-muted-foreground">
          EOIs attributed to individual brokers across your team&apos;s agencies, ranked by total
          pipeline value.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Broker</TableHead>
              <TableHead className="hidden sm:table-cell">Agency</TableHead>
              <TableHead className="hidden md:table-cell">Role</TableHead>
              <TableHead className="text-right">EOIs</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Pending</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Cleared</TableHead>
              <TableHead className="hidden text-right md:table-cell">Total Value</TableHead>
              <TableHead className="hidden text-right xl:table-cell">Pending Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.brokerContactId}>
                <TableCell className="font-medium">
                  {row.name}
                  <p className="mt-0.5 text-xs font-normal text-muted-foreground sm:hidden">
                    <Link href={`/agency/${row.agencyId}`} className="hover:underline">
                      {row.agencyName}
                    </Link>
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Link
                    href={`/agency/${row.agencyId}`}
                    className="text-foreground hover:underline"
                  >
                    {row.agencyName}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">{row.role ?? "—"}</TableCell>
                <TableCell className="text-right">{row.totalEois}</TableCell>
                <TableCell className="hidden text-right lg:table-cell">
                  {row.pendingCount > 0 ? (
                    <span className="font-medium text-warning">{row.pendingCount}</span>
                  ) : (
                    "0"
                  )}
                </TableCell>
                <TableCell className="hidden text-right lg:table-cell">
                  {row.clearedCount > 0 ? (
                    <span className="font-medium text-success">{row.clearedCount}</span>
                  ) : (
                    "0"
                  )}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {row.totalAmount.toLocaleString()} EGP
                </TableCell>
                <TableCell className="hidden text-right xl:table-cell">
                  {row.pendingAmount > 0
                    ? `${row.pendingAmount.toLocaleString()} EGP`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
