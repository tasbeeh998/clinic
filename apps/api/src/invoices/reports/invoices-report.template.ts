// Loose local shape — matches invoices.service.ts's INVOICE_ITEM_INCLUDE, kept
// independent of Prisma's generated types so this template only depends on
// the plain data it's handed.
export interface InvoiceReportRow {
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'VOID';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  total: number | string;
  paid: number | string;
  remaining: number | string;
  createdAt: string | Date;
  patient: { fullNameAr: string };
}

export interface InvoicesReportFilters {
  status?: string;
  patientName?: string;
  generatedAt: Date;
  generatedByName: string;
}

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

function formatMoney(value: number | string): string {
  return Number(value).toFixed(3);
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderInvoicesReportHtml(invoices: InvoiceReportRow[], filters: InvoicesReportFilters): string {
  const rows = invoices
    .map(
      (inv, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(inv.invoiceNumber)}</td>
        <td>${escapeHtml(inv.patient.fullNameAr)}</td>
        <td>${formatDate(inv.createdAt)}</td>
        <td>${formatMoney(inv.total)} د.ك</td>
        <td>${formatMoney(inv.paid)} د.ك</td>
        <td>${formatMoney(inv.remaining)} د.ك</td>
        <td>${STATUS_LABELS_AR[inv.status]}</td>
        <td>${PAYMENT_STATUS_LABELS_AR[inv.paymentStatus]}</td>
      </tr>`,
    )
    .join('');

  const totalSum = invoices.reduce((s, i) => s + Number(i.total), 0);
  const paidSum = invoices.reduce((s, i) => s + Number(i.paid), 0);
  const remainingSum = invoices.reduce((s, i) => s + Number(i.remaining), 0);

  const filterLine = filters.status
    ? `الفلترة: حالة الفاتورة = ${STATUS_LABELS_AR[filters.status as InvoiceReportRow['status']] || filters.status}`
    : 'الفلترة: كل الحالات';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Noto Naskh Arabic', 'Arial', sans-serif;
    color: #102F63;
    margin: 0;
    padding: 36px 40px;
    background: #FFFFFF;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #102F63;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .header h1 { font-size: 20px; color: #102F63; margin: 0 0 4px; }
  .header .meta { font-size: 12px; color: #64748B; }
  .header .accent { width: 60px; height: 4px; background: #E62E1B; border-radius: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11.5px; }
  th {
    background: #102F63;
    color: #FFFFFF;
    padding: 8px 8px;
    text-align: right;
    font-weight: 600;
  }
  td { padding: 7px 8px; border-bottom: 1px solid #E2E8F0; }
  tr:nth-child(even) td { background: #F6F8FC; }
  .summary {
    display: flex;
    gap: 20px;
    justify-content: flex-start;
    background: #F6F8FC;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 13px;
  }
  .summary .item { text-align: center; }
  .summary .label { color: #64748B; font-size: 11px; margin-bottom: 4px; }
  .summary .value { font-weight: bold; color: #102F63; font-size: 15px; }
  .summary .value.remaining { color: #C4362B; }
  .footer { text-align: center; font-size: 10px; color: #94A3B8; margin-top: 24px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>تقرير الفواتير</h1>
      <div class="meta">${filterLine}</div>
      <div class="meta">عدد الفواتير: ${invoices.length}</div>
    </div>
    <div style="text-align:left;">
      <div class="accent"></div>
      <div class="meta" style="margin-top:8px;">تاريخ الإصدار: ${formatDate(filters.generatedAt)}</div>
      <div class="meta">بواسطة: ${escapeHtml(filters.generatedByName)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>رقم الفاتورة</th>
        <th>المريضة</th>
        <th>التاريخ</th>
        <th>الإجمالي</th>
        <th>المدفوع</th>
        <th>المتبقي</th>
        <th>حالة الفاتورة</th>
        <th>حالة الدفع</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="summary">
    <div class="item">
      <div class="label">إجمالي المبالغ</div>
      <div class="value">${formatMoney(totalSum)} د.ك</div>
    </div>
    <div class="item">
      <div class="label">إجمالي المدفوع</div>
      <div class="value">${formatMoney(paidSum)} د.ك</div>
    </div>
    <div class="item">
      <div class="label">إجمالي المتبقي</div>
      <div class="value remaining">${formatMoney(remainingSum)} د.ك</div>
    </div>
  </div>

  <div class="footer">مركز العيادات التخصصية — تقرير مولّد إلكترونياً من نظام إدارة العيادة</div>
</body>
</html>`;
}
