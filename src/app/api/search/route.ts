import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { AgencyStatus } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import {
  excludeArchivedFilter,
  managerSearchAgencyFilter,
  managerTeamUserFilter,
  userAgencyAccessFilter,
} from "@/lib/agency/queries";
import { prisma } from "@/lib/prisma";

const agencySelect = {
  id: true,
  name: true,
  location: true,
  type: true,
  status: true,
  primaryOwner: { select: { name: true } },
} as const;

function agencyTextFilter(query: string) {
  if (!query) {
    return {};
  }

  return {
    OR: [
      { name: { contains: query } },
      { location: { contains: query } },
    ],
  };
}

function userTextFilter(query: string) {
  if (!query) {
    return {};
  }

  return {
    OR: [{ name: { contains: query } }, { email: { contains: query } }],
  };
}

function agencyWhereForRole(
  role: string,
  userId: string,
  query: string,
) {
  const text = agencyTextFilter(query);

  if (role === "SALES") {
    return {
      AND: [userAgencyAccessFilter(userId), text],
    };
  }

  if (role === "MANAGER") {
    return {
      AND: [managerSearchAgencyFilter(userId, role), text],
    };
  }

  return {
    AND: [excludeArchivedFilter(), text],
  };
}

function userWhereForRole(role: string, userId: string, query: string) {
  const text = userTextFilter(query);

  if (role === "SALES") {
    return {
      AND: [{ id: userId }, text],
    };
  }

  if (role === "MANAGER" || role === "DIRECTOR") {
    return {
      AND: [managerTeamUserFilter(userId, role), text],
    };
  }

  return text;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const { id: userId, role } = session.user;

  const [users, agencies] = await Promise.all([
    prisma.user.findMany({
      where: userWhereForRole(role, userId, query),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 8,
      orderBy: { name: "asc" },
    }),
    prisma.agency.findMany({
      where: agencyWhereForRole(role, userId, query),
      select: agencySelect,
      take: 8,
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    users,
    agencies: agencies.map((agency) => ({
      id: agency.id,
      name: agency.name,
      location: agency.location,
      type: agency.type,
      status: agency.status as AgencyStatus,
      primaryOwnerName: agency.primaryOwner?.name ?? null,
    })),
  });
}
