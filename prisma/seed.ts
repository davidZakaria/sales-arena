import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { createAuditLog } from "../src/lib/audit/create-audit-log";

const DEMO_PASSWORD = "brm123456";

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const director = await prisma.user.create({
    data: {
      name: "Mohamed Adel",
      email: "maya@newjerseyegypt.com",
      passwordHash,
      role: "DIRECTOR",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Reem Tantawy",
      email: "reem@newjerseyegypt.com",
      passwordHash,
      role: "MANAGER",
      managerId: director.id,
    },
  });

  const tantawy = await prisma.user.create({
    data: {
      name: "Ahmed Tantawy",
      email: "tantawy@newjerseyegypt.com",
      passwordHash,
      role: "SALES",
      managerId: manager.id,
    },
  });

  const karim = await prisma.user.create({
    data: {
      name: "Karim Hassan",
      email: "karim@newjerseyegypt.com",
      passwordHash,
      role: "SALES",
      managerId: manager.id,
    },
  });

  await prisma.agency.createMany({
    data: [
      {
        name: "Aqar Misr",
        type: "A",
        location: "New Cairo",
        repPhone1: "+201012345678",
        whatsappLink: "https://wa.me/201012345678",
        status: "ASSIGNED",
        primaryOwnerId: tantawy.id,
        contractStatus: "MISSING",
        commercialRegister: "CR-102938",
        taxId: null,
      },
      {
        name: "Nile Brokers",
        type: "B",
        location: "Maadi",
        repPhone1: "+201098765432",
        whatsappLink: "https://wa.me/201098765432",
        status: "ASSIGNED",
        primaryOwnerId: tantawy.id,
        contractStatus: "PENDING",
        commercialRegister: null,
        taxId: "300-123-456",
      },
      {
        name: "Pyramids Realty",
        type: "A",
        location: "6th October",
        repPhone1: "+201055566677",
        whatsappLink: "https://wa.me/201055566677",
        status: "ASSIGNED",
        primaryOwnerId: tantawy.id,
        contractStatus: "SIGNED",
        commercialRegister: "CR-445566",
        taxId: "300-987-654",
      },
      {
        name: "Delta Properties",
        type: "C",
        location: "Heliopolis",
        repPhone1: "+201033344455",
        whatsappLink: "https://wa.me/201033344455",
        status: "OPEN_RACE",
        contractStatus: "MISSING",
        commercialRegister: null,
        taxId: null,
      },
      {
        name: "Cairo Gate Realty",
        type: "B",
        location: "Sheikh Zayed",
        repPhone1: "+201066677788",
        whatsappLink: "https://wa.me/201066677788",
        status: "OPEN_RACE",
        contractStatus: "PENDING",
        commercialRegister: "CR-778899",
        taxId: null,
      },
      {
        name: "Horizon Estates",
        type: "A",
        location: "Nasr City",
        repPhone1: "+201077788899",
        whatsappLink: "https://wa.me/201077788899",
        status: "OPEN_RACE",
        contractStatus: "MISSING",
        commercialRegister: null,
        taxId: "300-555-111",
      },
    ],
  });

  const aqarMisr = await prisma.agency.findFirstOrThrow({
    where: { name: "Aqar Misr" },
  });

  const nileBrokers = await prisma.agency.findFirstOrThrow({
    where: { name: "Nile Brokers" },
  });

  await prisma.agency.update({
    where: { id: aqarMisr.id },
    data: {
      coOwners: { connect: { id: karim.id } },
    },
  });

  await prisma.agency.update({
    where: { id: nileBrokers.id },
    data: { isDisputed: true },
  });

  await createAuditLog(
    aqarMisr.id,
    tantawy.id,
    `${tantawy.name} added ${karim.name} as Co-Pilot`,
  );

  await createAuditLog(
    nileBrokers.id,
    karim.id,
    `${karim.name} filed a Dispute / Request Access`,
  );

  console.log("Seed complete.");
  console.log("Demo password for all users:", DEMO_PASSWORD);
  console.log("Users:");
  console.log(`  Director:     ${director.email}`);
  console.log(`  Manager:      ${manager.email}`);
  console.log(`  Sales (Primary): ${tantawy.email}`);
  console.log(`  Sales (Co-Pilot/Disputes): ${karim.email}`);
  console.log("");
  console.log("Demo scenarios:");
  console.log("  - Aqar Misr: Tantawy primary, Karim co-pilot");
  console.log("  - Nile Brokers: disputed by Karim (see Manager Dashboard)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
