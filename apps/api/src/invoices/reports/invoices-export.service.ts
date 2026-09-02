import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import ExcelJS from 'exceljs';
import { renderInvoicesReportHtml, InvoiceReportRow, InvoicesReportFilters } from './invoices-report.template';

const STATUS_LABELS_AR: Record<InvoiceReportRow['status'], string> = {
    DRAFT: 'مسودة',
    ISSUED: 'صادرة',
    VOID: 'ملغاة',
};

const PAYMENT_STATUS_LABELS_AR: Record<InvoiceReportRow['paymentStatus'], string> = {
    UNPAID: 'غير مدفوعة',
    PARTIALLY_PAID: 'مدفوعة جزئياً',
    PAID: 'مدفوعة بالكامل',
};

@Injectable()
export class InvoicesExportService implements OnModuleDestroy {
    private browserPromise: Promise<Browser> | null = null;

    // Reused across requests — launching a fresh Chromium process per export
    // would be far slower than keeping one instance warm.
    private async getBrowser(): Promise<Browser> {
        if (!this.browserPromise) {
            this.browserPromise = puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
        }
        return this.browserPromise;
    }

    async generatePdf(invoices: InvoiceReportRow[], filters: InvoicesReportFilters): Promise<Buffer> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        try {
            const html = renderInvoicesReportHtml(invoices, filters);
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: '0', bottom: '0', left: '0', right: '0' },
            });

            return Buffer.from(pdfBuffer);
        } finally {
            await page.close();
        }
    }

    async generateExcel(invoices: InvoiceReportRow[], filters: InvoicesReportFilters): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'نظام إدارة العيادة';
        workbook.created = filters.generatedAt;

        const sheet = workbook.addWorksheet('الفواتير', {
            views: [{ rightToLeft: true }],
        });

        sheet.columns = [
            { header: '#', key: 'index', width: 6 },
            { header: 'رقم الفاتورة', key: 'invoiceNumber', width: 16 },
            { header: 'المريضة', key: 'patient', width: 24 },
            { header: 'التاريخ', key: 'date', width: 16 },
            { header: 'الإجمالي (د.ك)', key: 'total', width: 14 },
            { header: 'المدفوع (د.ك)', key: 'paid', width: 14 },
            { header: 'المتبقي (د.ك)', key: 'remaining', width: 14 },
            { header: 'حالة الفاتورة', key: 'status', width: 14 },
            { header: 'حالة الدفع', key: 'paymentStatus', width: 16 },
        ];

        const headerRow = sheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102F63' } };
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        });

        invoices.forEach((inv, i) => {
            sheet.addRow({
                index: i + 1,
                invoiceNumber: inv.invoiceNumber,
                patient: inv.patient.fullNameAr,
                date: new Date(inv.createdAt).toLocaleDateString('ar-KW'),
                total: Number(inv.total),
                paid: Number(inv.paid),
                remaining: Number(inv.remaining),
                status: STATUS_LABELS_AR[inv.status],
                paymentStatus: PAYMENT_STATUS_LABELS_AR[inv.paymentStatus],
            });
        });

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            row.alignment = { horizontal: 'right' };
            if (rowNumber % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FC' } };
                });
            }
        });

        // Summary row
        const totalSum = invoices.reduce((s, i) => s + Number(i.total), 0);
        const paidSum = invoices.reduce((s, i) => s + Number(i.paid), 0);
        const remainingSum = invoices.reduce((s, i) => s + Number(i.remaining), 0);

        sheet.addRow({});
        const summaryRow = sheet.addRow({
            patient: 'الإجمالي',
            total: totalSum,
            paid: paidSum,
            remaining: remainingSum,
        });
        summaryRow.font = { bold: true };
        summaryRow.alignment = { horizontal: 'right' };

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async onModuleDestroy() {
        if (this.browserPromise) {
            const browser = await this.browserPromise;
            await browser.close();
        }
    }
}
