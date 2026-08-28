-- Enforce uniqueness on Service.code when present. Postgres treats multiple
-- NULLs as distinct in a unique index, so services with no code (e.g. "Report")
-- are unaffected and can continue to have code = NULL.
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
