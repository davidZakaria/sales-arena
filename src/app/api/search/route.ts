import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  const agencies = await prisma.agency.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { location: { contains: query } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      location: true,
      type: true,
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users, agencies });
}
