// Plain-JS twin of seed-patients.ts — same logic, no ts-node needed.
// Run inside the api container:
//   node prisma/seed-patients.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, 'seed-patients-data.json');
  const patients = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Loaded ${patients.length} patients from ${dataPath}`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of patients) {
    const existing = await prisma.patient.findUnique({ where: { civilId: p.civilId } });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await prisma.patient.create({
        data: {
          civilId: p.civilId,
          fullNameAr: p.fullNameAr,
          fullNameEn: p.fullNameEn || undefined,
          phone: p.phone || undefined,
          address: p.legacyFileNo ? `Legacy file #${p.legacyFileNo}` : undefined,
        },
      });
      created++;
    } catch (err) {
      failed++;
      console.error(`Failed to import ${p.civilId} (${p.fullNameAr}):`, err instanceof Error ? err.message : err);
    }
  }

  console.log('\n--- Import summary ---');
  console.log('Created:', created);
  console.log('Already existed (skipped):', skipped);
  console.log('Failed:', failed);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

