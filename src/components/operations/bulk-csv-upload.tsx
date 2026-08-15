"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import {
  getLegacyImportBaseline,
  importAgenciesBatch,
  type LegacyImportBatchResult,
} from "@/lib/actions/import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BATCH_SIZE = 100;

type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  usersCreated: number;
  warnings: string[];
};

function emptySummary(): ImportSummary {
  return {
    created: 0,
    updated: 0,
    skipped: 0,
    usersCreated: 0,
    warnings: [],
  };
}

function mergeBatchResult(summary: ImportSummary, batch: LegacyImportBatchResult): ImportSummary {
  return {
    created: summary.created + batch.created,
    updated: summary.updated + batch.updated,
    skipped: summary.skipped + batch.skipped,
    usersCreated: summary.usersCreated + batch.usersCreated,
    warnings: [...summary.warnings, ...batch.warnings].slice(0, 20),
  };
}

function parseSpreadsheetFile(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (parseResult) => {
          if (parseResult.errors.length > 0) {
            reject(new Error(parseResult.errors[0]?.message ?? "Failed to parse CSV."));
            return;
          }
          resolve(parseResult.data);
        },
        error: (parseError) => reject(new Error(parseError.message)),
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    return file.arrayBuffer().then((buffer) => {
      const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
      const sheetName =
        workbook.SheetNames.find((name) => {
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            workbook.Sheets[name],
            { defval: null },
          );
          if (rows.length === 0) {
            return false;
          }
          const headers = Object.keys(rows[0] ?? {}).map((header) => header.toLowerCase());
          return headers.includes("name");
        }) ?? workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("Spreadsheet contains no sheets.");
      }

      return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
        defval: null,
        raw: false,
      });
    });
  }

  return Promise.reject(new Error("Unsupported file type. Upload a .csv or .xlsx file."));
}

export function BulkCsvUpload() {
  const router = useRouter();
  const t = useTranslations("operations");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");

  const processFile = useCallback(
    (file: File) => {
      setError("");
      setSummary(null);
      setProgress(null);

      startTransition(async () => {
        try {
          const rows = await parseSpreadsheetFile(file);
          const dataRows = rows.filter((row) =>
            Object.values(row).some((value) => value !== null && String(value).trim() !== ""),
          );

          if (dataRows.length === 0) {
            setError(t("bulkUploadEmpty"));
            return;
          }

          const { baselineAgencyCount } = await getLegacyImportBaseline();
          const totalBatches = Math.ceil(dataRows.length / BATCH_SIZE);
          let runningSummary = emptySummary();

          for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
            setProgress({ current: batchIndex + 1, total: totalBatches });

            const start = batchIndex * BATCH_SIZE;
            const batchRows = dataRows.slice(start, start + BATCH_SIZE);
            const batchResult = await importAgenciesBatch(
              batchRows,
              start,
              baselineAgencyCount,
            );
            runningSummary = mergeBatchResult(runningSummary, batchResult);
          }

          setProgress(null);
          setSummary(runningSummary);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : t("bulkUploadFailed"));
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      });
    },
    [router, t],
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          {t("bulkUpload")}
        </CardTitle>
        <CardDescription>{t("bulkUploadHint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "rounded-lg border border-dashed px-4 py-8 text-center transition",
            isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Label htmlFor="legacy-upload" className="cursor-pointer">
            {t("bulkUploadDropHint")}
          </Label>
          <input
            ref={fileInputRef}
            id="legacy-upload"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={isPending}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {progress && (
          <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {t("bulkUploadProgress", {
              current: progress.current,
              total: progress.total,
            })}
          </p>
        )}

        {isPending && !progress && (
          <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            {t("bulkUploadParsing")}
          </p>
        )}

        {summary && !isPending && (
          <div className="status-success rounded-lg border px-4 py-3 text-sm">
            <p className="font-medium">{t("bulkUploadComplete")}</p>
            <p className="mt-1">
              {t("bulkUploadSummary", {
                created: summary.created,
                updated: summary.updated,
                skipped: summary.skipped,
                usersCreated: summary.usersCreated,
              })}
            </p>
            {summary.warnings.length > 0 && (
              <p className="mt-2 text-xs opacity-90">
                {summary.warnings.slice(0, 3).join(" ")}
                {summary.warnings.length > 3
                  ? ` (+${summary.warnings.length - 3} more)`
                  : ""}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="status-danger rounded-lg px-4 py-3 text-sm">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {isPending ? t("bulkUploadWorking") : t("bulkUploadChooseFile")}
        </Button>
      </CardContent>
    </Card>
  );
}
