-- Remove unique constraint from visitId to allow multiple invoices per visit
-- This is needed for the invoice replacement workflow where a replacement invoice
-- is created for the same visit after the original is voided
DROP INDEX IF EXISTS "Invoice_visitId_key";
