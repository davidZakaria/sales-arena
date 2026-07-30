import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { createAuditLog } from "../src/lib/audit/create-audit-log";

const DEMO_PASSWORD = "brm123456";

async function main() {
  await prisma.complianceDocument.deleteMany();
  await prisma.assignmentRequest.deleteMany();
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

  const operations = await prisma.user.create({
    data: {
      name: "Sara Operations",
      email: "ops@newjerseyegypt.com",
      passwordHash,
      role: "OPERATIONS",
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
        createdById: operations.id,
        contractStatus: "MISSING",
        commercialRegister: null,
        taxId: null,
      },
      {
        name: "Nile Brokers",
        type: "B",
        location: "Maadi",
        repPhone1: "+201098765432",
        whatsappLink: "https://wa.me/201098765432",
        status: "PENDING_AUDIT",
        primaryOwnerId: tantawy.id,
        createdById: operations.id,
        contractStatus: "PENDING",
        commercialRegister: null,
        taxId: null,
        submittedForAuditAt: new Date(),
      },
      {
        name: "Pyramids Realty",
        type: "A",
        location: "6th October",
        repPhone1: "+201055566677",
        whatsappLink: "https://wa.me/201055566677",
        status: "VERIFIED",
        primaryOwnerId: tantawy.id,
        createdById: operations.id,
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
        createdById: operations.id,
        contractStatus: "MISSING",
      },
      {
        name: "Cairo Gate Realty",
        type: "B",
        location: "Sheikh Zayed",
        repPhone1: "+201066677788",
        whatsappLink: "https://wa.me/201066677788",
        status: "OPEN_RACE",
        createdById: operations.id,
        contractStatus: "MISSING",
      },
      {
        name: "Draft Broker Co",
        type: "C",
        location: "Alexandria",
        repPhone1: "+201011122233",
        whatsappLink: "https://wa.me/201011122233",
        status: "DRAFT",
        createdById: operations.id,
        contractStatus: "MISSING",
      },
    ],
  });

  const aqarMisr = await prisma.agency.findFirstOrThrow({ where: { name: "Aqar Misr" } });
  const nileBrokers = await prisma.agency.findFirstOrThrow({ where: { name: "Nile Brokers" } });
  const delta = await prisma.agency.findFirstOrThrow({ where: { name: "Delta Properties" } });

  await prisma.agency.update({
    where: { id: aqarMisr.id },
    data: { coOwners: { connect: { id: karim.id } } },
  });

  await prisma.agency.update({
    where: { id: nileBrokers.id },
    data: { isDisputed: false },
  });

  await prisma.complianceDocument.createMany({
    data: [
      { agencyId: nileBrokers.id, uploadedById: tantawy.id, fileName: "tax-id.pdf", documentType: "TAX_ID" },
      { agencyId: nileBrokers.id, uploadedById: tantawy.id, fileName: "cr.pdf", documentType: "COMMERCIAL_REGISTER" },
      { agencyId: nileBrokers.id, uploadedById: tantawy.id, fileName: "contract.pdf", documentType: "CONTRACT" },
    ],
  });

  await prisma.assignmentRequest.create({
    data: {
      agencyId: delta.id,
      userId: karim.id,
      status: "PENDING",
    },
  });

  await createAuditLog(aqarMisr.id, tantawy.id, `${tantawy.name} added ${karim.name} as Co-Pilot`);
  await createAuditLog(nileBrokers.id, tantawy.id, `${tantawy.name} submitted documents for Operations audit`);
  await createAuditLog(delta.id, karim.id, `${karim.name} requested assignment from Open Race`);

  console.log("Seed complete.");
  console.log("Demo password for all users:", DEMO_PASSWORD);
  console.log("Users:");
  console.log(`  Director:    ${director.email}`);
  console.log(`  Manager:     ${manager.email}`);
  console.log(`  Operations:  ${operations.email}`);
  console.log(`  Sales:       ${tantawy.email}`);
  console.log(`  Sales:       ${karim.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
