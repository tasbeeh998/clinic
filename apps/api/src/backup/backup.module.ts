import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService], // needed so NotificationsModule can inject it
})
export class BackupModule {}
