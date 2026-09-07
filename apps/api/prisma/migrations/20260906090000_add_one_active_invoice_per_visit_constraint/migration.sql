-- Add partial unique index to enforce at most one active (DRAFT or ISSUED) invoice per visit
-- This allows VOID invoices (historical/replaced) to coexist with the active invoice
-- The index only applies to invoices with status IN ('DRAFT', 'ISSUED')
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_visitId_active_key"
ON "Invoice"("visitId")
WHERE "status" IN ('DRAFT', 'ISSUED');
