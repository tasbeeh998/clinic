import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createPatientDto: CreatePatientDto, userId: string, ipAddress?: string, userAgent?: string) {
    // Check for duplicate Civil ID
    if (createPatientDto.civilId) {
      const existingPatient = await this.prisma.patient.findUnique({
        where: { civilId: createPatientDto.civilId },
      });

      if (existingPatient) {
        throw new ConflictException('Patient with this Civil ID already exists');
      }
    }

    const patient = await this.prisma.patient.create({
      data: {
        ...createPatientDto,
        createdById: userId,
      },
    });

    await this.auditService.logUserAction(
      userId,
      'PATIENT_CREATED',
      'Patient',
      patient.id,
      ipAddress,
      userAgent,
    );

    return patient;
  }

  async findAll(search?: string, isArchived?: boolean, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: {
      isArchived?: boolean;
      OR?: Array<{
        civilId?: { contains: string; mode: 'insensitive' };
        fullNameAr?: { contains: string; mode: 'insensitive' };
        fullNameEn?: { contains: string; mode: 'insensitive' };
        phone?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (isArchived !== undefined) {
      where.isArchived = isArchived;
    }

    if (search) {
      where.OR = [
        { civilId: { contains: search, mode: 'insensitive' } },
        { fullNameAr: { contains: search, mode: 'insensitive' } },
        { fullNameEn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId: string, ipAddress?: string, userAgent?: string) {
    const existingPatient = await this.findOne(id);

    // Check for Civil ID conflict if being updated
    if (updatePatientDto.civilId && updatePatientDto.civilId !== existingPatient.civilId) {
      const duplicatePatient = await this.prisma.patient.findUnique({
        where: { civilId: updatePatientDto.civilId },
      });

      if (duplicatePatient) {
        throw new ConflictException('Patient with this Civil ID already exists');
      }
    }

    const updatedPatient = await this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
    });

    await this.auditService.logUserAction(
      userId,
      'PATIENT_UPDATED',
      'Patient',
      id,
      ipAddress,
      userAgent,
    );

    return updatedPatient;
  }

  async archive(id: string, userId: string, ipAddress?: string, userAgent?: string) {
    const patient = await this.findOne(id);

    if (patient.isArchived) {
      return patient; // Already archived
    }

    const archivedPatient = await this.prisma.patient.update({
      where: { id },
      data: { isArchived: true },
    });

    await this.auditService.logUserAction(
      userId,
      'PATIENT_ARCHIVED',
      'Patient',
      id,
      ipAddress,
      userAgent,
    );

    return archivedPatient;
  }

  async restore(id: string, userId: string, ipAddress?: string, userAgent?: string) {
    const patient = await this.findOne(id);

    if (!patient.isArchived) {
      return patient; // Already active
    }

    const restoredPatient = await this.prisma.patient.update({
      where: { id },
      data: { isArchived: false },
    });

    await this.auditService.logUserAction(
      userId,
      'PATIENT_RESTORED',
      'Patient',
      id,
      ipAddress,
      userAgent,
    );

    return restoredPatient;
  }
}
