-- Visit lifecycle status: every existing visit is backfilled as COMPLETED
-- (it already happened), new visits default to SCHEDULED going forward.
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Visit" ADD COLUMN "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED';
UPDATE "Visit" SET "status" = 'COMPLETED' WHERE "status" = 'SCHEDULED';
ALTER TABLE "Visit" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
