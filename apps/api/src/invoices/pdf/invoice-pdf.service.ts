import { Injectable } from '@nestjs/common';
import { InvoicesService } from '../invoices.service';
import { PdfBrowserService } from '../../common/filters/pdf/pdf-browser.service';
import { renderInvoiceHtml, InvoicePdfData } from './invoice-template';

@Injectable()
export class InvoicePdfService {
    constructor(
        private readonly invoicesService: InvoicesService,
        private readonly pdfBrowserService: PdfBrowserService,
    ) { }

    async generatePdf(invoiceId: string, locale: 'ar' | 'en' = 'en'): Promise<Buffer> {
        // Same data InvoicesService.findOne() already returns for the invoice
        // detail page — the PDF is guaranteed to match what's on screen because
        // it's built from the exact same query, not a second recomputation.
        const invoice = await this.invoicesService.findOne(invoiceId);
        const html = renderInvoiceHtml(invoice as unknown as InvoicePdfData, locale);
        return this.pdfBrowserService.renderHtmlToPdf(html);
    }
}
