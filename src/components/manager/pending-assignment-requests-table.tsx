"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveAssignmentRequest,
  rejectAssignmentRequest,
} from "@/lib/actions/assignment";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PendingAssignmentRow = {
  id: string;
  createdAt: Date;
  agency: { id: string; name: string; location: string | null };
  user: { id: string; name: string; email: string };
};

export function PendingAssignmentRequestsTable({
  requests,
}: {
  requests: PendingAssignmentRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-500">No pending assignment requests.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agency</TableHead>
          <TableHead>Requesting Rep</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <Link
                href={`/agency/${request.agency.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {request.agency.name}
              </Link>
              <p className="text-xs text-slate-500">{request.agency.location}</p>
            </TableCell>
            <TableCell>
              <p className="font-medium">{request.user.name}</p>
              <p className="text-xs text-slate-500">{request.user.email}</p>
            </TableCell>
            <TableCell>
              {new Date(request.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  disabled={isPending}
                  className="bg-slate-950 hover:bg-slate-800"
                  onClick={() => run(() => approveAssignmentRequest(request.id))}
                >
                  Approve & Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => rejectAssignmentRequest(request.id))}
                >
                  Reject
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
