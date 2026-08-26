import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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

  private computePaymentStatus(paid: number, total: number): 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' {
    if (paid <= 0) return 'UNPAID';
    if (paid >= total) return 'PAID';
    return 'PARTIALLY_PAID';
  }

  async create(createPaymentDto: CreatePaymentDto, userId: string, ipAddress?: string, userAgent?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: createPaymentDto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Invoice must be issued before recording a payment');
    }

    if (invoice.status === 'VOID') {
      throw new BadRequestException('Cannot record a payment on a voided invoice');
    }

    const remaining = Number(invoice.remaining);

    if (invoice.paymentStatus === 'PAID' || remaining <= 0) {
      throw new BadRequestException('This invoice is already fully paid');
    }

    // Guard against overpayment; a small epsilon avoids false positives from decimal rounding.
    if (createPaymentDto.amount > remaining + 0.001) {
      throw new BadRequestException(
        `Payment amount (${createPaymentDto.amount}) exceeds the remaining balance (${remaining})`,
      );
    }

    const total = Number(invoice.total);
    const newPaid = Math.round((Number(invoice.paid) + createPaymentDto.amount) * 100) / 100;
    const newRemaining = Math.round((total - newPaid) * 100) / 100;
    const newPaymentStatus = this.computePaymentStatus(newPaid, total);

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: createPaymentDto.amount,
          method: createPaymentDto.method,
          notes: createPaymentDto.notes,
          recordedById: userId,
        },
        include: PAYMENT_INCLUDE,
      }),
      this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paid: newPaid,
          remaining: newRemaining,
          paymentStatus: newPaymentStatus,
        },
      }),
    ]);

    await this.auditService.log(
      userId,
      'CREATE',
      'Payment',
      payment.id,
      null,
      {
        invoiceId: invoice.id,
        amount: payment.amount,
        method: payment.method,
      },
      ipAddress,
      userAgent,
    );

    return payment;
  }

  async findAllForInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.payment.findMany({
      where: { invoiceId },
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

  async remove(id: string, userId: string, userRole: string, ipAddress?: string, userAgent?: string) {
    // Only an admin may reverse a recorded payment (financial correction).
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only an admin can remove a recorded payment');
    }

    const payment = await this.findOne(id);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: payment.invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Related invoice not found');
    }

    const total = Number(invoice.total);
    const newPaid = Math.round((Number(invoice.paid) - Number(payment.amount)) * 100) / 100;
    const newRemaining = Math.round((total - newPaid) * 100) / 100;
    const newPaymentStatus = this.computePaymentStatus(newPaid, total);

    await this.prisma.$transaction([
      this.prisma.payment.delete({ where: { id } }),
      this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paid: newPaid,
          remaining: newRemaining,
          paymentStatus: newPaymentStatus,
        },
      }),
    ]);

    await this.auditService.log(
      userId,
      'DELETE',
      'Payment',
      id,
      { invoiceId: invoice.id, amount: payment.amount, method: payment.method },
      null,
      ipAddress,
      userAgent,
    );

    return { id, deleted: true };
  }
}
