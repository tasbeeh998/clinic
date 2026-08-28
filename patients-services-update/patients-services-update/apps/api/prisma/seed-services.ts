// One-off, safe-to-re-run seed for the clinic's initial service price list.
// Run manually with: npx ts-node prisma/seed-services.ts  (inside the api container)
// Matches existing services by code (or by name for the one service with no code,
// "Report") and skips them — never overwrites a price you've already edited from
// the UI. Only inserts services that don't exist yet.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_SERVICES: Array<{ name: string; code: string | null; price: number }> = [
  { name: 'Consultation', code: 'OBA0001', price: 35 },
  { name: 'Follow-up before', code: 'OBA0003', price: 30 },
  { name: 'Son. only', code: 'OBA0004', price: 30 },
  { name: 'Son (More 27W)', code: 'OBA0005', price: 30 },
  { name: 'Sonar (Twins)', code: 'OBA0006', price: 40 },
  { name: 'Sonar 4 D', code: 'OBA0007', price: 40 },
  { name: 'Insert of loop', code: 'OBA0009', price: 70 },
  { name: 'Rem. Of Loop', code: 'OBA0010', price: 40 },
  { name: 'Betadin wash', code: 'OBA0011', price: 20 },
  { name: 'Cautary', code: 'OBA0012', price: 80 },
  { name: 'Cautery (per stick)', code: 'OBA0013', price: 10 },
  { name: 'Wound dres', code: 'OBA0014', price: 20 },
  { name: 'Minor surg.', code: 'OBA0015', price: 150 },
  { name: 'Rem. Of CER OPD', code: 'OBA0016', price: 70 },
  { name: 'CTG', code: 'OBA0017', price: 20 },
  { name: 'Urine', code: 'OBA0018', price: 3 },
  { name: 'Pap Smear', code: 'OBA0019', price: 20 },
  { name: 'HVS', code: 'OBA0020', price: 5 },
  { name: 'IUI', code: 'OBA0021', price: 200 },
  { name: 'Other', code: 'INJEC(charge)', price: 2 },
  { name: 'Report', code: null, price: 10 },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const svc of INITIAL_SERVICES) {
    const existing = svc.code
      ? await prisma.service.findUnique({ where: { code: svc.code } })
      : await prisma.service.findFirst({ where: { name: svc.name, code: null } });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.service.create({
      data: {
        name: svc.name,
        code: svc.code,
        currentPrice: svc.price,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`Done. Created ${created} service(s), skipped ${skipped} already-existing service(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
