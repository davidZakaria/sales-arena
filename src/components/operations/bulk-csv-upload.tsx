"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { bulkImportAgencies, type BulkImportResult } from "@/lib/actions/operations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function BulkCsvUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResult) => {
        if (parseResult.errors.length > 0) {
          setError(parseResult.errors[0]?.message ?? "Failed to parse CSV.");
          return;
        }

        if (parseResult.data.length === 0) {
          setError("CSV file contains no data rows.");
          return;
        }

        startTransition(async () => {
          try {
            const importResult = await bulkImportAgencies(parseResult.data);
            setResult(importResult);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed.");
          } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        });
      },
      error: (parseError) => {
        setError(parseError.message);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          CSV Bulk Upload
        </CardTitle>
        <CardDescription>
          Import broker leads from CSV. Rows with duplicate phone or WhatsApp are skipped.
          Include a <strong>Sales</strong> column to auto-assign; leave blank for Open Race.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-upload">Spreadsheet file</Label>
          <input
            ref={fileInputRef}
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            disabled={isPending}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {isPending && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Importing agencies…
          </p>
        )}

        {result && !isPending && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              result.imported > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <p className="font-medium">
              Import complete: {result.imported} imported, {result.skipped} skipped
              {result.skippedInvalid > 0
                ? `, ${result.skippedInvalid} invalid rows ignored`
                : ""}
              .
            </p>
            {result.skippedDuplicates.length > 0 && (
              <p className="mt-1 text-xs opacity-90">
                Skipped duplicates: {result.skippedDuplicates.slice(0, 5).join(", ")}
                {result.skippedDuplicates.length > 5
                  ? ` (+${result.skippedDuplicates.length - 5} more)`
                  : ""}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {isPending ? "Importing…" : "Choose CSV File"}
        </Button>
      </CardContent>
    </Card>
  );
}
