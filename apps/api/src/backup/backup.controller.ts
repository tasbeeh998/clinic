import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BackupService } from './backup.service';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Full database access either way (dump or restore), so Admin-only.
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('status')
  getStatus() {
    return this.backupService.getStatus();
  }

  @Get('list')
  listBackups() {
    return this.backupService.listBackups();
  }

  @Post('run')
  runBackup(@Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.backupService.runBackup('manual', req.user.id, ipAddress, userAgent);
  }

  @Post('restore')
  restoreBackup(@Request() req, @Body() dto: RestoreBackupDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.backupService.restoreBackup(dto.filename, req.user.id, ipAddress, userAgent);
  }
}
