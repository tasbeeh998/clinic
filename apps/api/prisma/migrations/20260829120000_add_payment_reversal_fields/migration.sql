-- Add PaymentStatus enum
CREATE TYPE "PaymentStatus" AS ENUM ('RECORDED', 'REVERSED');

-- Add payment reversal fields to Payment model
ALTER TABLE "Payment" ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'RECORDED';
ALTER TABLE "Payment" ADD COLUMN "reversedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "reversedBy" UUID;
ALTER TABLE "Payment" ADD COLUMN "reversalNotes" TEXT;

-- Add index for status
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- Add foreign key constraint for reversedBy
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reversedBy_fkey" FOREIGN KEY ("reversedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
