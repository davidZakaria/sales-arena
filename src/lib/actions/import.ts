"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  importLegacyAgenciesBatch,
  type LegacyImportBatchResult,
  type LegacyImportRow,
} from "@/lib/import/legacy-agency-import";

export type { LegacyImportBatchResult };

async function requireOperations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "OPERATIONS") {
    throw new Error("Unauthorized");
  }
  return session;
}

function revalidateImportPaths() {
  revalidatePath("/operations");
  revalidatePath("/manager");
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  revalidatePath("/open-race");
}

export async function getLegacyImportBaseline(): Promise<{ baselineAgencyCount: number }> {
  await requireOperations();
  return { baselineAgencyCount: await prisma.agency.count() };
}

export async function importAgenciesBatch(
  rows: LegacyImportRow[],
  globalStartIndex: number,
  baselineAgencyCount: number,
): Promise<LegacyImportBatchResult> {
  await requireOperations();

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      usersCreated: 0,
      usersMatched: 0,
      openRaceCount: 0,
      assignedCount: 0,
      warnings: [],
    };
  }

  const result = await importLegacyAgenciesBatch(rows, {
    globalStartIndex,
    baselineAgencyCount,
  });

  revalidateImportPaths();
  return result;
}
