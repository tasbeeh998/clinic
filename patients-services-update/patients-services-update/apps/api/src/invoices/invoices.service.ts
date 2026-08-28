import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceStatus } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';

const INVOICE_ITEM_INCLUDE = {
  invoiceItems: {
    include: {
      service: {
        select: { code: true },
      },
    },
  },
  patient: {
    select: {
      id: true,
      civilId: true,
      fullNameAr: true,
      phone: true,
    },
  },
  visit: {
    select: {
      id: true,
      type: true,
      visitDate: true,
      diagnosis: true,
    },
  },
  payments: true,
};

@Injectable()
export class InvoicesService {
  // Status transition rules: DRAFT -> ISSUED -> VOID (or DRAFT -> VOID directly)
  private readonly VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['ISSUED', 'VOID'],
    ISSUED: ['VOID'],
    VOID: [], // Terminal state
  };

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private validateStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): void {
    if (currentStatus === newStatus) {
      return;
    }

    const validTransitions = this.VALID_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ') || 'none'}`,
      );
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  async create(createInvoiceDto: CreateInvoiceDto, userId: string, ipAddress?: string, userAgent?: string) {
    // Validate visit exists
    const visit = await this.prisma.visit.findUnique({
      where: { id: createInvoiceDto.visitId },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    // A visit can have at most one invoice (schema enforces this too)
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { visitId: createInvoiceDto.visitId },
    });

    if (existingInvoice) {
      throw new ConflictException('This visit already has an invoice');
    }

    // Validate and price every requested service, snapshotting name + price
    const serviceIds = createInvoiceDto.items.map((item) => item.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const invoiceItemsData = createInvoiceDto.items.map((item) => {
      const service = serviceMap.get(item.serviceId);

      if (!service) {
        throw new NotFoundException(`Service ${item.serviceId} not found`);
      }

      if (!service.isActive) {
        throw new BadRequestException(`Service "${service.name}" is not active and cannot be invoiced`);
      }

      const quantity = item.quantity ?? 1;
      // Use the per-item override if provided, otherwise fall back to the
      // service's current default price. The service's own price is never
      // written to here — this only affects this one invoice's snapshot.
      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : Number(service.currentPrice);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

      return {
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        unitPriceSnapshot: unitPrice,
        quantity,
        lineTotal,
      };
    });

    const subtotal = Math.round(invoiceItemsData.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
    // No tax and no additional fees are supported currently, so total mirrors subtotal.
    const total = subtotal;
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        visitId: visit.id,
        patientId: visit.patientId,
        status: 'DRAFT',
        subtotal,
        total,
        paid: 0,
        remaining: total,
        paymentStatus: 'UNPAID',
        createdById: userId,
        invoiceItems: {
          create: invoiceItemsData,
        },
      },
      include: INVOICE_ITEM_INCLUDE,
    });

    await this.auditService.log(
      userId,
      'CREATE',
      'Invoice',
      invoice.id,
      null,
      {
        invoiceNumber: invoice.invoiceNumber,
        visitId: invoice.visitId,
        patientId: invoice.patientId,
        total: invoice.total,
        status: invoice.status,
      },
      ipAddress,
      userAgent,
    );

    return invoice;
  }

  async findAll(patientId?: string, status?: InvoiceStatus, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: { patientId?: string; status?: InvoiceStatus } = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: INVOICE_ITEM_INCLUDE,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_ITEM_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateStatus(id: string, updateStatusDto: UpdateInvoiceStatusDto, userId: string, ipAddress?: string, userAgent?: string) {
    const invoice = await this.findOne(id);

    this.validateStatusTransition(invoice.status, updateStatusDto.status);

    const data: { status: InvoiceStatus; issuedAt?: Date; issuedById?: string } = {
      status: updateStatusDto.status,
    };

    if (updateStatusDto.status === 'ISSUED') {
      data.issuedAt = new Date();
      data.issuedById = userId;
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data,
      include: INVOICE_ITEM_INCLUDE,
    });

    await this.auditService.log(
      userId,
      'STATUS_CHANGE',
      'Invoice',
      id,
      { status: invoice.status },
      { status: updated.status },
      ipAddress,
      userAgent,
    );

    return updated;
  }
}
