import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const PAYMENT_INCLUDE = {
  recordedBy: {
    select: { id: true, name: true },
  },
};

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private computePaymentStatus(paid: Decimal, total: Decimal): 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' {
    if (paid.lte(0)) return 'UNPAID';
    if (paid.gte(total)) return 'PAID';
    return 'PARTIALLY_PAID';
  }

  private async recordedDirectPayments(tx: Prisma.TransactionClient, invoiceId: string): Promise<Decimal> {
    const result = await tx.payment.aggregate({
      where: { invoiceId, status: 'RECORDED' },
      _sum: { amount: true },
    });
    return new Decimal(result._sum.amount ?? 0).toDecimalPlaces(2);
  }

  private async refreshInvoiceBalance(tx: Prisma.TransactionClient, invoiceId: string) {
    const invoice = await tx.invoice.findUnique({ where: { id: invoiceId }, select: { total: true } });
    if (!invoice) throw new NotFoundException('Related invoice not found');

    const directPaid = await this.recordedDirectPayments(tx, invoiceId);
    const allocationRows = await tx.paymentAllocation.findMany({
      where: { invoiceId, payment: { status: 'RECORDED' } },
      select: { amount: true },
    });
    const allocatedPaid = allocationRows.reduce((sum, allocation) => sum.add(allocation.amount), new Decimal(0));
    const paid = directPaid.add(allocatedPaid).toDecimalPlaces(2);
    const remaining = Decimal.max(invoice.total.sub(paid), new Decimal(0)).toDecimalPlaces(2);
    const paymentStatus = this.computePaymentStatus(paid, invoice.total);
    return tx.invoice.update({ where: { id: invoiceId }, data: { paid, remaining, paymentStatus } });
  }

  async create(createPaymentDto: CreatePaymentDto, userId: string, ipAddress?: string, userAgent?: string) {
    // Use transaction with row locking for true concurrency safety
    return this.prisma.$transaction(async (tx) => {
      // Lock the invoice row for update to prevent concurrent payment over-collection
      const invoice = await tx.$queryRaw<Array<{
        id: string;
        status: string;
        subtotal: string;
        total: string;
        paid: string;
        remaining: string;
        paymentStatus: string;
      }>>`
        SELECT id, status, subtotal, total, paid, remaining, "paymentStatus"
        FROM "Invoice"
        WHERE id = ${createPaymentDto.invoiceId}::uuid
        FOR UPDATE
      `;

      if (!invoice[0]) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice[0].status === 'DRAFT') {
        throw new BadRequestException('Invoice must be issued before recording a payment');
      }

      if (invoice[0].status === 'VOID') {
        throw new BadRequestException('Cannot record a payment on a voided invoice');
      }

      const remaining = new Decimal(invoice[0].remaining);

      if (invoice[0].paymentStatus === 'PAID' || remaining.lte(0)) {
        throw new BadRequestException('This invoice is already fully paid');
      }

      // Guard against overpayment using Decimal comparison
      const paymentAmount = new Decimal(createPaymentDto.amount);
      if (paymentAmount.gt(remaining)) {
        throw new BadRequestException(
          `Payment amount (${createPaymentDto.amount}) exceeds the remaining balance (${remaining.toString()})`,
        );
      }

      const total = new Decimal(invoice[0].total);
      const paid = new Decimal(invoice[0].paid);
      const newPaid = paid.add(paymentAmount).toDecimalPlaces(2);
      const newRemaining = total.sub(newPaid).toDecimalPlaces(2);
      const newPaymentStatus = this.computePaymentStatus(newPaid, total);

      // Create payment and update invoice atomically
      const createdPayment = await tx.payment.create({
        data: {
          invoiceId: invoice[0].id,
          amount: paymentAmount,
          method: createPaymentDto.method,
          notes: createPaymentDto.notes,
          recordedById: userId,
        },
        include: PAYMENT_INCLUDE,
      });

      await tx.invoice.update({
        where: { id: invoice[0].id },
        data: {
          paid: newPaid,
          remaining: newRemaining,
          paymentStatus: newPaymentStatus,
        },
      });

      // Audit log within transaction
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'Payment',
          entityId: createdPayment.id,
          beforeState: null,
          afterState: {
            invoiceId: invoice[0].id,
            amount: paymentAmount.toString(),
            method: createPaymentDto.method,
          },
          ipAddress,
          userAgent,
        },
      });

      return createdPayment;
    });
  }

  async findAllForInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.payment.findMany({
      where: { 
        invoiceId,
        status: 'RECORDED', // Only show non-reversed payments
      },
      include: PAYMENT_INCLUDE,
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async reverse(id: string, reversePaymentDto: ReversePaymentDto, userId: string, userRole: string, ipAddress?: string, userAgent?: string) {
    // Only an admin may reverse a recorded payment (financial correction).
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only an admin can reverse a recorded payment');
    }

    // Use transaction for safe payment reversal with row locking
    await this.prisma.$transaction(async (tx) => {
      // Lock the payment row for update
      const payment = await tx.$queryRaw<Array<{
        id: string;
        invoiceId: string;
        amount: string;
        method: string;
        status: string;
      }>>`
        SELECT id, "invoiceId", amount, method, status
        FROM "Payment"
        WHERE id = ${id}::uuid
        FOR UPDATE
      `;

      if (!payment[0]) {
        throw new NotFoundException('Payment not found');
      }

      // Prevent reversing the same payment twice
      if (payment[0].status === 'REVERSED') {
        throw new BadRequestException('This payment has already been reversed');
      }

      // Lock the invoice row for update
      const invoice = await tx.$queryRaw<Array<{
        id: string;
        total: string;
        paid: string;
      }>>`
        SELECT id, total, paid
        FROM "Invoice"
        WHERE id = ${payment[0].invoiceId}::uuid
        FOR UPDATE
      `;

      if (!invoice[0]) {
        throw new NotFoundException('Related invoice not found');
      }

      const allocations = await tx.paymentAllocation.findMany({
        where: { paymentId: id },
        select: { invoiceId: true },
      });

      // Lock every affected replacement in stable order before changing the
      // payment status. Their cached balance is derived from these allocations.
      const affectedInvoiceIds = [...new Set(allocations.map((allocation) => allocation.invoiceId))].sort();
      for (const affectedInvoiceId of affectedInvoiceIds) {
        await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${affectedInvoiceId}::uuid FOR UPDATE`;
      }

      // Mark payment as reversed instead of deleting
      await tx.payment.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedBy: userId,
          reversalNotes: reversePaymentDto.reversalNotes,
        },
      });

      // Recalculate source and all derived replacement balances from persisted
      // recorded payments/allocations; no copied payment credit can survive.
      await this.refreshInvoiceBalance(tx, invoice[0].id);
      for (const affectedInvoiceId of affectedInvoiceIds) {
        await this.refreshInvoiceBalance(tx, affectedInvoiceId);
      }

      // Audit log within transaction
      await tx.auditLog.create({
        data: {
          userId,
          action: 'REVERSE',
          entityType: 'Payment',
          entityId: id,
          beforeState: { 
            invoiceId: payment[0].invoiceId, 
            amount: payment[0].amount, 
            method: payment[0].method,
            status: payment[0].status,
          },
          afterState: { 
            status: 'REVERSED', 
            reversedAt: new Date(),
            reversalNotes: reversePaymentDto.reversalNotes,
          },
          ipAddress,
          userAgent,
        },
      });
    });

    return { id, reversed: true };
  }
}
