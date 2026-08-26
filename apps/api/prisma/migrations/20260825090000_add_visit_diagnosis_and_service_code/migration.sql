-- Add optional diagnosis field to Visit (shown on invoice PDF patient info block)
ALTER TABLE "Visit" ADD COLUMN "diagnosis" TEXT;

-- Add optional code field to Service (shown on invoice PDF service table)
ALTER TABLE "Service" ADD COLUMN "code" TEXT;
