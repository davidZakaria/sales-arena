/**
 * List all user accounts in the database.
 * Run: npm run db:list-users
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  if (users.length === 0) {
    console.log("No users found. Run: npm run db:seed");
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);
  console.table(users);
  console.log("\nDefault seed password (if not changed): brm123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
