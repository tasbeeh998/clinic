import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Skip logging for system actions (non-UUID userId)
    if (userId === 'system' || userId === 'unknown') {
      return;
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: afterState ? JSON.stringify(afterState) : null,
        ipAddress,
        userAgent,
      },
    });
  }

  async logUserAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log(userId, action, entityType, entityId, null, null, ipAddress, userAgent);
  }

  // Real listing for the Settings page's "سجل التغييرات" — every row here is
  // an actual logged action, nothing invented.
  async findAll(entityType?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = entityType ? { entityType } : {};

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
