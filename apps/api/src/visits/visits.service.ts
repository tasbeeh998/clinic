import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VisitType, VisitStatus } from '@prisma/client';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';

const VISIT_INCLUDE = {
  patient: {
    select: {
      id: true,
      civilId: true,
      fullNameAr: true,
      phone: true,
    },
  },
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  invoices: {
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      paid: true,
      remaining: true,
      paymentStatus: true,
      invoiceItems: {
        select: { serviceNameSnapshot: true },
      },
    },
  },
};

@Injectable()
export class VisitsService {
  // Same pattern as InvoicesService's VALID_TRANSITIONS — explicit allowed
  // transitions, terminal states have none.
  private readonly VALID_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
    SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createVisitDto: CreateVisitDto, userId: string, ipAddress?: string, userAgent?: string) {
    // Validate patient exists and is not archived
    const patient = await this.prisma.patient.findUnique({
      where: { id: createVisitDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.isArchived) {
      throw new BadRequestException('Cannot create visit for archived patient');
    }

    // Validate appointment if provided
    if (createVisitDto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: createVisitDto.appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.patientId !== createVisitDto.patientId) {
        throw new BadRequestException('Appointment does not belong to this patient');
      }
    }

    const visit = await this.prisma.visit.create({
      data: {
        patientId: createVisitDto.patientId,
        appointmentId: createVisitDto.appointmentId,
        type: createVisitDto.type,
        visitDate: createVisitDto.visitDate ? new Date(createVisitDto.visitDate) : new Date(),
        notes: createVisitDto.notes,
        diagnosis: createVisitDto.diagnosis,
        createdById: userId,
      },
      include: VISIT_INCLUDE,
    });

    await this.auditService.log(
      userId,
      'CREATE',
      'Visit',
      visit.id,
      null,
      {
        patientId: visit.patientId,
        appointmentId: visit.appointmentId,
        type: visit.type,
        status: visit.status,
        visitDate: visit.visitDate,
      },
      ipAddress,
      userAgent,
    );

    return visit;
  }

  async findAll(
    patientId?: string,
    appointmentId?: string,
    type?: VisitType,
    status?: VisitStatus,
    from?: string,
    to?: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: {
      patientId?: string;
      appointmentId?: string;
      type?: VisitType;
      status?: VisitStatus;
      visitDate?: { gte?: Date; lte?: Date };
      patient?: {
        OR: Array<{ fullNameAr?: { contains: string; mode: 'insensitive' }; civilId?: { contains: string } }>;
      };
    } = {};

    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (type) where.type = type;
    if (status) where.status = status;

    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = new Date(from);
      if (to) where.visitDate.lte = new Date(to);
    }

    if (search) {
      const term = search.trim();
      where.patient = {
        OR: [{ fullNameAr: { contains: term, mode: 'insensitive' } }, { civilId: { contains: term } }],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.visit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: VISIT_INCLUDE,
      }),
      this.prisma.visit.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Today's status breakdown for the receptionist's quick-glance cards on the
  // Visits page. Real counts from today's visits only — never invented.
  async getTodayCounts() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const counts = await this.prisma.visit.groupBy({
      by: ['status'],
      where: { visitDate: { gte: startOfDay, lte: endOfDay } },
      _count: { status: true },
    });

    const byStatus: Record<VisitStatus, number> = {
      SCHEDULED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of counts) {
      byStatus[row.status] = row._count.status;
    }

    const total = byStatus.SCHEDULED + byStatus.IN_PROGRESS + byStatus.COMPLETED + byStatus.CANCELLED;

    return {
      total,
      scheduled: byStatus.SCHEDULED,
      inProgress: byStatus.IN_PROGRESS,
      completed: byStatus.COMPLETED,
      cancelled: byStatus.CANCELLED,
    };
  }

  async findOne(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: VISIT_INCLUDE,
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    return visit;
  }

  async update(id: string, updateVisitDto: UpdateVisitDto, userId: string, ipAddress?: string, userAgent?: string) {
    const visit = await this.findOne(id);

    // Validate patient if changing
    if (updateVisitDto.patientId && updateVisitDto.patientId !== visit.patientId) {
      throw new BadRequestException('Cannot change patient after visit creation');
    }

    // Validate appointment if provided
    if (updateVisitDto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: updateVisitDto.appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.patientId !== visit.patientId) {
        throw new BadRequestException('Appointment does not belong to this patient');
      }
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: {
        type: updateVisitDto.type,
        visitDate: updateVisitDto.visitDate ? new Date(updateVisitDto.visitDate) : undefined,
        notes: updateVisitDto.notes,
        diagnosis: updateVisitDto.diagnosis,
        appointmentId: updateVisitDto.appointmentId,
      },
      include: VISIT_INCLUDE,
    });

    await this.auditService.log(
      userId,
      'UPDATE',
      'Visit',
      id,
      {
        type: visit.type,
        visitDate: visit.visitDate,
        notes: visit.notes,
        diagnosis: visit.diagnosis,
        appointmentId: visit.appointmentId,
      },
      {
        type: updated.type,
        visitDate: updated.visitDate,
        notes: updated.notes,
        diagnosis: updated.diagnosis,
        appointmentId: updated.appointmentId,
      },
      ipAddress,
      userAgent,
    );

    return updated;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateVisitStatusDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const visit = await this.findOne(id);
    const currentStatus = visit.status;
    const newStatus = updateStatusDto.status;

    if (currentStatus === newStatus) {
      return visit;
    }

    const validTransitions = this.VALID_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ') || 'none'}`,
      );
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: { status: newStatus },
      include: VISIT_INCLUDE,
    });

    await this.auditService.log(
      userId,
      'UPDATE_STATUS',
      'Visit',
      id,
      { status: currentStatus },
      { status: newStatus },
      ipAddress,
      userAgent,
    );

    return updated;
  }

  async findByPatientId(patientId: string, page: number = 1, limit: number = 20) {
    return this.findAll(patientId, undefined, undefined, undefined, undefined, undefined, undefined, page, limit);
  }
}
