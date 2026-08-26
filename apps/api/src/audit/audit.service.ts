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
}
