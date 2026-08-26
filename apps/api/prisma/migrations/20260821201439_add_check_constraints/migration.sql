-- Add CHECK constraints for data integrity

-- Invoice.paid >= 0
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paid_check" CHECK ("paid" >= 0);

-- Invoice.remaining >= 0
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_remaining_check" CHECK ("remaining" >= 0);

-- InvoiceItem.quantity > 0
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_quantity_check" CHECK ("quantity" > 0);

-- InvoiceItem.lineTotal >= 0
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_lineTotal_check" CHECK ("lineTotal" >= 0);

-- Payment.amount > 0
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" > 0);

-- Service.currentPrice >= 0
ALTER TABLE "Service" ADD CONSTRAINT "Service_currentPrice_check" CHECK ("currentPrice" >= 0);

-- InvoiceAdditionalCharge.chargeValue >= 0
ALTER TABLE "InvoiceAdditionalCharge" ADD CONSTRAINT "InvoiceAdditionalCharge_chargeValue_check" CHECK ("chargeValue" >= 0);

-- InvoiceAdditionalCharge.calculatedAmount >= 0
ALTER TABLE "InvoiceAdditionalCharge" ADD CONSTRAINT "InvoiceAdditionalCharge_calculatedAmount_check" CHECK ("calculatedAmount" >= 0);
