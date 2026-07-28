import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    const [users, agencies] = await Promise.all([
      prisma.user.findMany({
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
        select: {
          id: true,
          name: true,
          location: true,
          type: true,
        },
        take: 8,
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ users, agencies });
  }

  const pattern = `%${query}%`;

  const [users, agencies] = await Promise.all([
    prisma.$queryRaw<
      Array<{ id: string; name: string; email: string; role: string }>
    >`
      SELECT id, name, email, role
      FROM User
      WHERE name LIKE ${pattern} COLLATE NOCASE
         OR email LIKE ${pattern} COLLATE NOCASE
      ORDER BY name ASC
      LIMIT 8
    `,
    prisma.$queryRaw<
      Array<{ id: string; name: string; location: string | null; type: string | null }>
    >`
      SELECT id, name, location, type
      FROM Agency
      WHERE name LIKE ${pattern} COLLATE NOCASE
         OR location LIKE ${pattern} COLLATE NOCASE
      ORDER BY name ASC
      LIMIT 8
    `,
  ]);

  return NextResponse.json({ users, agencies });
}
