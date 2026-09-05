// One-off, safe-to-re-run import of the legacy patient list (BB.xlsx).
//
// IMPORTANT CONTEXT for whoever runs this:
// - The source file had no official Kuwait Civil ID (12 digits) for any
//   patient — only phone numbers, names, and an internal paper file number.
// - `civilId` is required + unique in the schema, so the phone number is
//   used as a stand-in for now. Where two patients genuinely share one
//   phone number (e.g. a mother and daughter), a "-2", "-3" suffix was
//   added to keep civilId unique without dropping anyone.
// - 12 records had neither a phone nor could be matched to one — those got
//   a clearly-fake civilId like "NOPHONE-B3R412" so they're easy to find
//   and fix later (search the app for "NOPHONE").
// - The original internal file number is kept in `address` as a note
//   (e.g. "Legacy file #1094") purely for your own reference while
//   cross-checking against paper folders — it is NOT used anywhere else in
//   the app.
// - Matches existing rows by civilId, so running this twice does not create
//   duplicates; it just skips anyone already in the database.
//
// Run inside the api container:
//   npx ts-node prisma/seed-patients.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface LegacyPatient {
  civilId: string;
  fullNameAr: string;
  fullNameEn: string | null;
  phone: string | null;
  legacyFileNo: string | null;
}

async function main() {
  const dataPath = path.join(__dirname, 'seed-patients-data.json');
  const patients: LegacyPatient[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

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

