"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const REVALIDATE_PATHS = ["/open-race", "/dashboard", "/portfolio", "/manager"] as const;

function revalidateClaimPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function revertExpiredClaims(): Promise<number> {
  const now = new Date();

  const expired = await prisma.agency.findMany({
    where: {
      claimExpiresAt: { lt: now },
      contractStatus: { not: "SIGNED" },
    },
    select: { id: true },
  });

  if (expired.length === 0) {
    return 0;
  }

  await Promise.all(
    expired.map((agency) =>
      prisma.agency.update({
        where: { id: agency.id },
        data: {
          status: "OPEN_RACE",
          primaryOwnerId: null,
          claimedAt: null,
          claimExpiresAt: null,
          isDisputed: false,
          coOwners: { set: [] },
        },
      }),
    ),
  );

  revalidateClaimPaths();

  for (const agency of expired) {
    revalidatePath(`/agency/${agency.id}`);
  }

  return expired.length;
}
