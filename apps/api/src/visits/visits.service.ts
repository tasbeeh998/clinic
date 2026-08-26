import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VisitType } from '@prisma/client';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class VisitsService {
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
        createdById: userId,
      },
      include: {
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
      },
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
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: {
      patientId?: string;
      appointmentId?: string;
      type?: VisitType;
      visitDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (appointmentId) {
      where.appointmentId = appointmentId;
    }

    if (type) {
      where.type = type;
    }

    if (from || to) {
      where.visitDate = {};
      if (from) {
        where.visitDate.gte = new Date(from);
      }
      if (to) {
        where.visitDate.lte = new Date(to);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.visit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
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
        },
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

  async findOne(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
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
      },
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
        appointmentId: updateVisitDto.appointmentId,
      },
      include: {
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
      },
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
        appointmentId: visit.appointmentId,
      },
      {
        type: updated.type,
        visitDate: updated.visitDate,
        notes: updated.notes,
        appointmentId: updated.appointmentId,
      },
      ipAddress,
      userAgent,
    );

    return updated;
  }

  async findByPatientId(patientId: string, page: number = 1, limit: number = 20) {
    return this.findAll(patientId, undefined, undefined, undefined, undefined, page, limit);
  }
}
