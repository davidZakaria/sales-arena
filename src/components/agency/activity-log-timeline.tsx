import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ActivityLogEntry = {
  id: string;
  action: string;
  createdAt: Date;
  user: {
    name: string;
  };
};

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function ActivityLogTimeline({ logs }: { logs: ActivityLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Immutable audit trail showing who performed each action on this agency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <ol className="relative ml-3 space-y-6 border-l border-slate-200">
            {logs.map((log) => (
              <li key={log.id} className="relative ml-6">
                <span className="absolute top-1.5 -left-[1.65rem] h-3 w-3 rounded-full border-2 border-white bg-slate-400 ring-1 ring-slate-200" />
                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.user.name} · {formatTimestamp(log.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
