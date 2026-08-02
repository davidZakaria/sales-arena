import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { createAuditLog } from "../src/lib/audit/create-audit-log";
import { CLAIM_SLA_DAYS } from "../src/lib/claims/constants";

const DEMO_PASSWORD = "brm123456";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  await prisma.eOI.deleteMany();
  await prisma.brokerContact.deleteMany();
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

  const finance = await prisma.user.create({
    data: {
      name: "Nadia Finance",
      email: "finance@newjerseyegypt.com",
      passwordHash,
      role: "FINANCE",
      managerId: director.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Inbound Automation",
      email: "inbound@newjerseyegypt.com",
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

  const yasmine = await prisma.user.create({
    data: {
      name: "Yasmine Nabil",
      email: "yasmine@newjerseyegypt.com",
      passwordHash,
      role: "SALES",
      managerId: manager.id,
    },
  });

  await prisma.agency.createMany({
    data: [
      // —— Sales dashboard: action required ——
      {
        name: "Aqar Misr",
        type: "A",
        location: "New Cairo",
        repPhone1: "+201012345678",
        whatsappLink: "https://wa.me/201012345678",
        status: "ASSIGNED",
        primaryOwnerId: tantawy.id,
        createdById: operations.id,
        source: "OPERATIONS",
        contractStatus: "MISSING",
        contractDuration: "6 months",
        claimedAt: daysAgo(5),
        claimExpiresAt: daysFromNow(CLAIM_SLA_DAYS - 5),
      },
      {
        name: "Heliopolis Partners",
        type: "B",
        location: "Heliopolis",
        repPhone1: "+201044455566",
        whatsappLink: "https://wa.me/201044455566",
        status: "ASSIGNED",
        primaryOwnerId: karim.id,
        createdById: operations.id,
        source: "PUBLIC_PORTAL",
        inboundNotes: "Registered via /join portal",
        contractStatus: "MISSING",
        contractDuration: "1 year",
        claimedAt: daysAgo(3),
        claimExpiresAt: daysFromNow(CLAIM_SLA_DAYS - 3),
      },
      // —— Ops audit queue ——
      {
        name: "Nile Brokers",
        type: "B",
        location: "Maadi",
        repPhone1: "+201098765432",
        whatsappLink: "https://wa.me/201098765432",
        status: "PENDING_AUDIT",
        primaryOwnerId: tantawy.id,
        createdById: operations.id,
        source: "OPERATIONS",
        contractStatus: "PENDING",
        contractDuration: "6 months",
        submittedForAuditAt: daysAgo(1),
        claimedAt: daysAgo(20),
        claimExpiresAt: daysFromNow(CLAIM_SLA_DAYS - 20),
      },
      {
        name: "Red Sea Properties",
        type: "A",
        location: "Hurghada",
        repPhone1: "+201022233344",
        whatsappLink: "https://wa.me/201022233344",
        status: "PENDING_AUDIT",
        primaryOwnerId: yasmine.id,
        createdById: operations.id,
        source: "WHATSAPP",
        inboundNotes: "Inbound WhatsApp lead — converted to assigned",
        contractStatus: "PENDING",
        submittedForAuditAt: daysAgo(2),
        claimedAt: daysAgo(18),
        claimExpiresAt: daysFromNow(CLAIM_SLA_DAYS - 18),
      },
      // —— Verified portfolio ——
      {
        name: "Pyramids Realty",
        type: "A",
        location: "6th October",
        repPhone1: "+201055566677",
        whatsappLink: "https://wa.me/201055566677",
        status: "VERIFIED",
        primaryOwnerId: tantawy.id,
        createdById: operations.id,
        source: "OPERATIONS",
        contractStatus: "SIGNED",
        contractDuration: "1 year",
        commercialRegister: "CR-445566",
        taxId: "300-987-654",
        claimedAt: daysAgo(45),
        claimExpiresAt: daysFromNow(CLAIM_SLA_DAYS),
      },
      // —— Manager: SLA breach + dispute ——
      {
        name: "Oasis Estates",
        type: "B",
        location: "Sheikh Zayed",
        repPhone1: "+201033322211",
        whatsappLink: "https://wa.me/201033322211",
        status: "ASSIGNED",
        primaryOwnerId: karim.id,
        createdById: operations.id,
        source: "OPERATIONS",
        contractStatus: "MISSING",
        isDisputed: true,
        claimedAt: daysAgo(30),
        claimExpiresAt: daysAgo(5),
      },
      // —— Manager assignment queue ——
      {
        name: "Delta Properties",
        type: "C",
        location: "Heliopolis",
        repPhone1: "+201033344455",
        whatsappLink: "https://wa.me/201033344455",
        status: "OPEN_RACE",
        createdById: operations.id,
        source: "OPERATIONS",
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
        source: "OPERATIONS",
        contractStatus: "MISSING",
      },
      {
        name: "North Coast Brokers",
        type: "A",
        location: "North Coast",
        repPhone1: "+201088899900",
        whatsappLink: "https://wa.me/201088899900",
        status: "OPEN_RACE",
        createdById: operations.id,
        source: "PUBLIC_PORTAL",
        inboundNotes: "Portal registration — published by Ops",
        contractStatus: "MISSING",
      },
      // —— Ops draft leads (all inbound sources) ——
      {
        name: "Draft Broker Co",
        type: "C",
        location: "Alexandria",
        repPhone1: "+201011122233",
        whatsappLink: "https://wa.me/201011122233",
        status: "DRAFT",
        createdById: operations.id,
        source: "PUBLIC_PORTAL",
        inboundNotes: "Self-registered on /join",
        contractStatus: "MISSING",
      },
      {
        name: "WhatsApp Lead Demo",
        type: "C",
        location: "Giza",
        repPhone1: "+201077788899",
        whatsappLink: "https://wa.me/201077788899",
        status: "DRAFT",
        createdById: operations.id,
        source: "WHATSAPP",
        inboundNotes: "Interested in New Cairo projects",
        contractStatus: "MISSING",
      },
      {
        name: "Manual Ops Draft",
        type: "B",
        location: "Nasr City",
        repPhone1: "+201099887766",
        whatsappLink: "https://wa.me/201099887766",
        status: "DRAFT",
        createdById: operations.id,
        source: "OPERATIONS",
        contractStatus: "MISSING",
      },
      // —— Archive demo ——
      {
        name: "Legacy Broker LLC",
        type: "C",
        location: "Downtown Cairo",
        repPhone1: "+201010101010",
        whatsappLink: "https://wa.me/201010101010",
        status: "ARCHIVED",
        primaryOwnerId: tantawy.id,
        createdById: operations.id,
        source: "OPERATIONS",
        contractStatus: "MISSING",
      },
    ],
  });

  const aqarMisr = await prisma.agency.findFirstOrThrow({ where: { name: "Aqar Misr" } });
  const nileBrokers = await prisma.agency.findFirstOrThrow({ where: { name: "Nile Brokers" } });
  const redSea = await prisma.agency.findFirstOrThrow({ where: { name: "Red Sea Properties" } });
  const pyramids = await prisma.agency.findFirstOrThrow({ where: { name: "Pyramids Realty" } });
  const oasis = await prisma.agency.findFirstOrThrow({ where: { name: "Oasis Estates" } });
  const heliopolis = await prisma.agency.findFirstOrThrow({ where: { name: "Heliopolis Partners" } });
  const delta = await prisma.agency.findFirstOrThrow({ where: { name: "Delta Properties" } });
  const cairoGate = await prisma.agency.findFirstOrThrow({ where: { name: "Cairo Gate Realty" } });
  const northCoast = await prisma.agency.findFirstOrThrow({ where: { name: "North Coast Brokers" } });

  // Demo-stable broker self-registration links (Aqar Misr + Pyramids are ASSIGNED/VERIFIED)
  await prisma.agency.update({
    where: { id: aqarMisr.id },
    data: { brokerInviteToken: "demo-invite-aqar-misr" },
  });
  await prisma.agency.update({
    where: { id: pyramids.id },
    data: { brokerInviteToken: "demo-invite-pyramids" },
  });

  // Typed compliance fields on audit-queue agencies (Ops audit mode)
  await prisma.agency.update({
    where: { id: nileBrokers.id },
    data: { taxId: "300-111-222", commercialRegister: "CR-NILE-001" },
  });
  await prisma.agency.update({
    where: { id: redSea.id },
    data: { taxId: "300-333-444", commercialRegister: "CR-REDSEA-88" },
  });

  await prisma.agency.update({
    where: { id: aqarMisr.id },
    data: { coOwners: { connect: { id: karim.id } } },
  });

  await prisma.complianceDocument.createMany({
    data: [
      // Aqar Misr — partial upload (action required)
      { agencyId: aqarMisr.id, uploadedById: tantawy.id, fileName: "tax-id.pdf", documentType: "TAX_ID" },
      { agencyId: aqarMisr.id, uploadedById: tantawy.id, fileName: "cr-draft.pdf", documentType: "COMMERCIAL_REGISTER" },
      // Heliopolis — partial (compliance watch)
      { agencyId: heliopolis.id, uploadedById: karim.id, fileName: "tax-id-scan.pdf", documentType: "TAX_ID" },
      // Oasis — partial + SLA breach
      { agencyId: oasis.id, uploadedById: karim.id, fileName: "tax-id.pdf", documentType: "TAX_ID" },
      // Nile Brokers — full set → audit queue
      { agencyId: nileBrokers.id, uploadedById: tantawy.id, fileName: "tax-id.pdf", documentType: "TAX_ID" },
      { agencyId: nileBrokers.id, uploadedById: tantawy.id, fileName: "cr.pdf", documentType: "COMMERCIAL_REGISTER" },
      { agencyId: nileBrokers.id, uploadedById: tantawy.id, fileName: "contract.pdf", documentType: "CONTRACT" },
      // Red Sea — audit queue
      { agencyId: redSea.id, uploadedById: yasmine.id, fileName: "tax-id.pdf", documentType: "TAX_ID" },
      { agencyId: redSea.id, uploadedById: yasmine.id, fileName: "cr.pdf", documentType: "COMMERCIAL_REGISTER" },
      { agencyId: redSea.id, uploadedById: yasmine.id, fileName: "contract.pdf", documentType: "CONTRACT" },
      // Pyramids — verified vault
      { agencyId: pyramids.id, uploadedById: tantawy.id, fileName: "tax-id.pdf", documentType: "TAX_ID" },
      { agencyId: pyramids.id, uploadedById: tantawy.id, fileName: "cr.pdf", documentType: "COMMERCIAL_REGISTER" },
      { agencyId: pyramids.id, uploadedById: tantawy.id, fileName: "contract-signed.pdf", documentType: "CONTRACT" },
    ],
  });

  await prisma.brokerContact.createMany({
    data: [
      // Aqar Misr — rich broker directory
      { agencyId: aqarMisr.id, name: "Ahmed Hassan", phone: "+20 100 555 0101", role: "Team Leader" },
      { agencyId: aqarMisr.id, name: "Mona El-Sayed", phone: "+20 100 555 0102", role: "Agent" },
      { agencyId: aqarMisr.id, name: "Nour Ali", phone: "+20 100 555 0103", role: "Junior Agent" },
      // Pyramids — verified agency brokers
      { agencyId: pyramids.id, name: "Karim Nabil", phone: "+20 100 555 0201", role: "Owner" },
      { agencyId: pyramids.id, name: "Sara Fathy", phone: "+20 100 555 0202", role: "Agent" },
      { agencyId: pyramids.id, name: "Hassan Morad", phone: "+20 100 555 0203", role: "Senior Agent" },
      // Nile Brokers — audit queue
      { agencyId: nileBrokers.id, name: "Tarek Mostafa", phone: "+20 100 555 0301", role: "Director" },
      { agencyId: nileBrokers.id, name: "Laila Ashraf", phone: "+20 100 555 0302", role: "Agent" },
      // Red Sea — audit queue
      { agencyId: redSea.id, name: "Omar Reda", phone: "+20 100 555 0401", role: "Owner" },
      { agencyId: redSea.id, name: "Dina Hosny", phone: "+20 100 555 0402", role: "Agent" },
      // Heliopolis — assigned, partial docs
      { agencyId: heliopolis.id, name: "Hani Fouad", phone: "+20 100 555 0501", role: "Team Leader" },
      { agencyId: heliopolis.id, name: "Rana Soliman", phone: "+20 100 555 0502", role: "Agent" },
      // Oasis — disputed + SLA breach
      { agencyId: oasis.id, name: "Youssef Kamal", phone: "+20 100 555 0601", role: "Agent" },
    ],
  });

  await prisma.assignmentRequest.createMany({
    data: [
      { agencyId: delta.id, userId: yasmine.id, status: "PENDING" },
      { agencyId: cairoGate.id, userId: karim.id, status: "PENDING" },
      { agencyId: northCoast.id, userId: tantawy.id, status: "PENDING" },
    ],
  });

  const monaElSayed = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: aqarMisr.id, name: "Mona El-Sayed" },
  });
  const saraFathy = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: pyramids.id, name: "Sara Fathy" },
  });
  const hassanMorad = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: pyramids.id, name: "Hassan Morad" },
  });
  const tarekMostafa = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: nileBrokers.id, name: "Tarek Mostafa" },
  });
  const lailaAshraf = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: nileBrokers.id, name: "Laila Ashraf" },
  });
  const omarReda = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: redSea.id, name: "Omar Reda" },
  });
  const haniFouad = await prisma.brokerContact.findFirstOrThrow({
    where: { agencyId: heliopolis.id, name: "Hani Fouad" },
  });

  await prisma.eOI.createMany({
    data: [
      // Finance — pending clearance
      {
        agencyId: aqarMisr.id,
        userId: tantawy.id,
        brokerContactId: monaElSayed.id,
        clientName: "Mohamed Saleh",
        project: "NJ Towers — Unit 12B",
        amount: 2_500_000,
        paymentMethod: "Bank Transfer",
        receiptUrl: "mock://receipts/reservation-receipt.pdf",
        status: "PENDING_FINANCE",
      },
      {
        agencyId: heliopolis.id,
        userId: karim.id,
        brokerContactId: haniFouad.id,
        clientName: "Sara Mahmoud",
        project: "NJ Gardens — Villa 7",
        amount: 4_800_000,
        paymentMethod: "Cheque",
        receiptUrl: "mock://receipts/cheque-scan.pdf",
        status: "PENDING_FINANCE",
      },
      {
        agencyId: nileBrokers.id,
        userId: tantawy.id,
        brokerContactId: tarekMostafa.id,
        clientName: "Amira Khaled",
        project: "NJ Marina — Unit 8A",
        amount: 3_400_000,
        paymentMethod: "Bank Transfer",
        receiptUrl: "mock://receipts/nile-wire.pdf",
        status: "PENDING_FINANCE",
      },
      // Finance — verified, ready to convert
      {
        agencyId: pyramids.id,
        userId: tantawy.id,
        brokerContactId: saraFathy.id,
        clientName: "Hassan El-Masry",
        project: "NJ Heights — Penthouse A",
        amount: 6_200_000,
        paymentMethod: "Bank Transfer",
        receiptUrl: "mock://receipts/wire-confirmation.pdf",
        status: "VERIFIED",
      },
      // Finance — rejected (with notes)
      {
        agencyId: oasis.id,
        userId: karim.id,
        clientName: "Ali Farouk",
        project: "NJ Marina — Unit 3C",
        amount: 1_800_000,
        paymentMethod: "Cash Deposit",
        receiptUrl: "mock://receipts/invalid-receipt.pdf",
        status: "REJECTED",
        financeNotes: "Receipt amount does not match EOI. Request updated bank transfer proof.",
      },
      // Finance — converted (historical)
      {
        agencyId: pyramids.id,
        userId: tantawy.id,
        brokerContactId: saraFathy.id,
        clientName: "Nour Ibrahim",
        project: "NJ Heights — Unit 5A",
        amount: 3_100_000,
        paymentMethod: "Bank Transfer",
        receiptUrl: "mock://receipts/converted-receipt.pdf",
        status: "CONVERTED",
      },
      {
        agencyId: pyramids.id,
        userId: tantawy.id,
        brokerContactId: hassanMorad.id,
        clientName: "Yasmin Adel",
        project: "NJ Heights — Unit 2C",
        amount: 2_900_000,
        paymentMethod: "Bank Transfer",
        receiptUrl: "mock://receipts/pyramids-converted-2.pdf",
        status: "CONVERTED",
      },
      // Red Sea — pending (shows on finance when attributed)
      {
        agencyId: redSea.id,
        userId: yasmine.id,
        brokerContactId: omarReda.id,
        clientName: "Khaled Mansour",
        project: "NJ Coast — Chalet 14",
        amount: 1_950_000,
        paymentMethod: "Bank Transfer",
        receiptUrl: "mock://receipts/redsea-deposit.pdf",
        status: "PENDING_FINANCE",
      },
      // Laila — second broker on Nile for manager performance rollup
      {
        agencyId: nileBrokers.id,
        userId: tantawy.id,
        brokerContactId: lailaAshraf.id,
        clientName: "Fatma Zaki",
        project: "NJ Towers — Unit 4D",
        amount: 2_100_000,
        paymentMethod: "Cheque",
        receiptUrl: "mock://receipts/nile-cheque.pdf",
        status: "VERIFIED",
      },
    ],
  });

  await createAuditLog(aqarMisr.id, tantawy.id, `${tantawy.name} added ${karim.name} as Co-Pilot`);
  await createAuditLog(aqarMisr.id, tantawy.id, `${tantawy.name} uploaded compliance documents (partial)`);
  await createAuditLog(aqarMisr.id, tantawy.id, `${tantawy.name} added broker contact Mona El-Sayed`);
  await createAuditLog(aqarMisr.id, tantawy.id, `${tantawy.name} submitted EOI for Mohamed Saleh — NJ Towers — Unit 12B (2500000)`);
  await createAuditLog(nileBrokers.id, tantawy.id, `${tantawy.name} submitted documents for Operations audit`);
  await createAuditLog(nileBrokers.id, tantawy.id, `${tantawy.name} submitted EOI for Amira Khaled — NJ Marina — Unit 8A (3400000)`);
  await createAuditLog(redSea.id, yasmine.id, `${yasmine.name} submitted documents for Operations audit`);
  await createAuditLog(redSea.id, yasmine.id, `${yasmine.name} submitted EOI for Khaled Mansour — NJ Coast — Chalet 14 (1950000)`);
  await createAuditLog(heliopolis.id, karim.id, `${karim.name} uploaded compliance documents (partial)`);
  await createAuditLog(heliopolis.id, karim.id, `${karim.name} submitted EOI for Sara Mahmoud — NJ Gardens — Villa 7 (4800000)`);
  await createAuditLog(oasis.id, yasmine.id, `${yasmine.name} opened Dispute on assignment for ${oasis.name}`);
  await createAuditLog(oasis.id, finance.id, `${finance.name} rejected EOI for Ali Farouk: Receipt amount does not match EOI`);
  await createAuditLog(pyramids.id, finance.id, `${finance.name} verified EOI funds for Hassan El-Masry`);
  await createAuditLog(pyramids.id, finance.id, `${finance.name} converted EOI for Nour Ibrahim to contract`);
  await createAuditLog(pyramids.id, finance.id, `${finance.name} converted EOI for Yasmin Adel to contract`);
  await createAuditLog(pyramids.id, operations.id, `${operations.name} verified agency compliance — ${pyramids.name}`);
  await createAuditLog(delta.id, operations.id, `${operations.name} sent ${delta.name} to manager assignment queue`);
  await createAuditLog(cairoGate.id, operations.id, `${operations.name} sent ${cairoGate.name} to manager assignment queue`);
  await createAuditLog(northCoast.id, operations.id, `${operations.name} sent ${northCoast.name} to manager assignment queue`);
  await createAuditLog(delta.id, yasmine.id, `${yasmine.name} requested assignment for ${delta.name}`);
  await createAuditLog(cairoGate.id, karim.id, `${karim.name} requested assignment for ${cairoGate.name}`);
  await createAuditLog(northCoast.id, tantawy.id, `${tantawy.name} requested assignment for ${northCoast.name}`);
  await createAuditLog(nileBrokers.id, finance.id, `${finance.name} verified EOI funds for Fatma Zaki`);

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  BRM Demo Seed — Prototype Presentation");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`\nPassword (all users): ${DEMO_PASSWORD}\n`);

  console.log("ROLES & LANDING PAGES");
  console.log("──────────────────────────────────────────────────────────");
  console.log(`  Director    ${director.email}     → /dashboard + /manager`);
  console.log(`  Manager     ${manager.email}      → /manager (lead queue, SLA, EOIs)`);
  console.log(`  Operations  ${operations.email}  → /operations (drafts, audit)`);
  console.log(`  Finance     ${finance.email} → /finance (EOI clearance)`);
  console.log(`  Sales       ${tantawy.email}  → /dashboard (Aqar Misr, Nile, Pyramids)`);
  console.log(`  Sales       ${karim.email}    → /dashboard + co-pilot on Aqar Misr`);
  console.log(`  Sales       ${yasmine.email} → Red Sea audit, Oasis dispute`);

  console.log("\nDEMO HIGHLIGHTS BY SCREEN");
  console.log("──────────────────────────────────────────────────────────");
  console.log("  /operations     3 draft leads · 2 audit queue · compliance watch");
  console.log("  /finance        4 pending · 2 verified · 1 rejected · 2 converted EOIs");
  console.log("  /dashboard      Action required · pending audit · EOI metrics");
  console.log("  /manager        3 leads in queue · SLA breach · dispute · broker EOI stats");
  console.log("  /open-race      Redirects to /manager (managers) or /portfolio (sales)");
  console.log("  /agency/*       Broker contacts tab · compliance vault · EOIs");
  console.log("\nBROKER CONTACTS & SELF-REGISTRATION");
  console.log("──────────────────────────────────────────────────────────");
  console.log("  Aqar Misr       3 brokers (Mona has pending EOI)");
  console.log("  Pyramids        3 brokers (2 converted EOIs)");
  console.log("  Nile / Red Sea  2 brokers each + audit-queue EOIs");
  console.log("  Heliopolis      2 brokers · partial compliance");
  console.log("  Invite links    /en/broker-join/demo-invite-aqar-misr");
  console.log("                  /en/broker-join/demo-invite-pyramids");

  console.log("\n══════════════════════════════════════════════════════════\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
