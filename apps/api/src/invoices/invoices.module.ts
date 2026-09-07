import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { PdfBrowserService } from '../common/filters/pdf/pdf-browser.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicePdfService, PdfBrowserService],
  exports: [InvoicesService],
})
export class InvoicesModule { }
