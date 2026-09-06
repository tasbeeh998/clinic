import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports-export.service';
import { ReportsController } from './reports.controller';
import { DatabaseModule } from '../database/database.module';
import { PdfBrowserService } from '../common/filters/pdf/pdf-browser.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsExportService, PdfBrowserService],
})
export class ReportsModule {}
