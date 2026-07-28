/**
 * One-off patch: rename director display name in the database.
 * Run on VPS: npm run db:patch-director
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.user.updateMany({
    where: { email: "maya@newjerseyegypt.com", role: "DIRECTOR" },
    data: { name: "Mohamed Adel" },
  });

  if (result.count === 0) {
    const byOldName = await prisma.user.updateMany({
      where: { name: "Maya El-Sayed", role: "DIRECTOR" },
      data: { name: "Mohamed Adel" },
    });
    console.log(`Updated ${byOldName.count} director(s) by previous name.`);
  } else {
    console.log(`Updated ${result.count} director(s) to Mohamed Adel.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
