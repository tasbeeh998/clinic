import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { BackupService } from '../backup/backup.service';

// Real, DB-backed notifications — not a decorative badge. Two triggers for
// now, matching what was actually asked for:
//   1. An appointment starting soon that hasn't been flagged yet.
//   2. No backup has run in the last day (the scheduled 3am cron should
//      have covered it — this is the "did it actually happen" check).
//
// Email delivery is NOT wired up yet (no SMTP provider chosen at the time
// this was built). The `notifyByEmail()` stub below is exactly where that
// call goes once a provider is picked — everything else here (the DB
// record, the in-app bell) already works standalone.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // How far ahead to warn about an appointment. Kept as a constant (not an
  // env var) for now since nobody asked for it to be configurable yet.
  private readonly APPOINTMENT_LOOKAHEAD_HOURS = 2;
  private readonly BACKUP_STALE_HOURS = 25; // 1h grace past the daily 3am job

  constructor(
    private prisma: PrismaService,
    private backupService: BackupService,
  ) {}

  // Runs every 15 minutes. Cheap queries, no external calls, safe to run
  // this often so a notification shows up soon after it becomes true.
  @Cron('*/15 * * * *')
  async checkAndGenerate() {
    try {
      await this.checkUpcomingAppointments();
    } catch (err) {
      this.logger.error('Upcoming-appointment check failed', err instanceof Error ? err.stack : err);
    }
    try {
      await this.checkBackupDue();
    } catch (err) {
      this.logger.error('Backup-due check failed', err instanceof Error ? err.stack : err);
    }
  }

  private async checkUpcomingAppointments() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.APPOINTMENT_LOOKAHEAD_HOURS * 60 * 60 * 1000);

    const upcoming = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['BOOKED', 'CONFIRMED'] },
        scheduledAt: { gte: now, lte: windowEnd },
      },
      include: { patient: { select: { fullNameAr: true } } },
    });

    for (const appt of upcoming) {
      // Don't re-notify for the same appointment on every 15-minute tick.
      const existing = await this.prisma.notification.findFirst({
        where: { type: 'APPOINTMENT_UPCOMING', relatedId: appt.id },
      });
      if (existing) continue;

      await this.prisma.notification.create({
        data: {
          type: 'APPOINTMENT_UPCOMING',
          title: 'appointmentUpcoming', // frontend maps this + patientName via i18n
          message: appt.patient.fullNameAr,
          relatedId: appt.id,
        },
      });

      // notifyByEmail({ type: 'APPOINTMENT_UPCOMING', appointmentId: appt.id }); // wire up once SMTP is chosen
    }
  }

  private async checkBackupDue() {
    const status = await this.backupService.getStatus();
    const lastBackupAt = status.lastBackup ? new Date(status.lastBackup.createdAt) : null;
    const hoursSinceLastBackup = lastBackupAt
      ? (Date.now() - lastBackupAt.getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (hoursSinceLastBackup < this.BACKUP_STALE_HOURS) return;

    // One notification per calendar day, not one every 15 minutes while
    // the condition remains true.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existingToday = await this.prisma.notification.findFirst({
      where: { type: 'BACKUP_DUE', createdAt: { gte: todayStart } },
    });
    if (existingToday) return;

    await this.prisma.notification.create({
      data: {
        type: 'BACKUP_DUE',
        title: 'backupDue',
        message: lastBackupAt ? lastBackupAt.toISOString() : 'never',
      },
    });

    // notifyByEmail({ type: 'BACKUP_DUE' }); // wire up once SMTP is chosen
  }

  async findAll(onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: onlyUnread ? { isRead: false } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount() {
    return this.prisma.notification.count({ where: { isRead: false } });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  }
}
