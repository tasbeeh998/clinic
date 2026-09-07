import { CLINIC_LOGO_BASE64 } from './clinic-logo';

// Loose shape matching InvoicesService.findOne()'s include (invoiceItems + service.code,
// patient, visit + diagnosis, payments). Kept local (rather than importing Prisma's
// generated types) so this template has no dependency beyond the plain data it's handed.
export interface InvoicePdfData {
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'VOID';
  subtotal: number | string;
  total: number | string;
  paid: number | string;
  remaining: number | string;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  issuedAt?: string | Date | null;
  createdAt: string | Date;
  replacedByInvoiceId?: string | null;
  patient: {
    fullNameAr: string;
    civilId: string;
    phone?: string | null;
  };
  visit?: {
    type: 'CHECKUP' | 'FOLLOW_UP' | 'OTHER';
    diagnosis?: string | null;
  } | null;
  invoiceItems: Array<{
    serviceNameSnapshot: string;
    unitPriceSnapshot: number | string;
    quantity: number;
    lineTotal: number | string;
    service?: { code: string | null } | null;
  }>;
  additionalCharges?: Array<{
    chargeType: 'PERCENTAGE' | 'FIXED';
    chargeValue: number | string;
    calculatedAmount: number | string;
    description?: string | null;
  }>;
  payments: Array<{
    amount: number | string;
    method: 'CASH' | 'VISA' | 'KNET' | 'OTHER';
    paymentDate: string | Date;
    status?: 'RECORDED' | 'REVERSED';
  }>;
}

// Locale is driven entirely by the frontend. The backend has no concept of the
// active react-i18next language on its own, so whatever page/button triggers the
// PDF (download or "send via WhatsApp") MUST pass the current i18n.language along
// with the request, e.g.:
//   GET /invoices/:id/pdf?lang=ar
//   GET /invoices/:id/pdf?lang=en
// and the controller/service should forward it here as `locale`.
export type InvoiceLocale = 'ar' | 'en';

// ── Fixed clinic identity — single-doctor clinic, never changes per invoice ──
// The doctor's name/title and the address/contact block are ALWAYS shown in
// Arabic, even on the English invoice — this is a deliberate choice (not a
// bug): only the section labels (Invoice No., Patient Information, ...) and
// the values pulled from the invoice itself switch language. See
// DOCTOR_FIXED / CONTACT_FIXED below, which are read regardless of `locale`.
const FIXED: Record<InvoiceLocale, {
  clinicNameLine1: string;
  clinicNameLine2: string;
}> = {
  ar: {
    clinicNameLine1: 'مركز العيادات التخصصية',
    clinicNameLine2: 'Specialized Clinics Center',
  },
  en: {
    clinicNameLine1: 'Specialized Clinics Center',
    clinicNameLine2: 'مركز العيادات التخصصية',
  },
};

// Always Arabic, regardless of invoice locale.
const DOCTOR_FIXED = {
  doctorName: 'د. نداء بوخضور',
  doctorTitle: 'استشاري أمراض النساء والولادة والعقم',
};

// Always Arabic, regardless of invoice locale.
const CONTACT_FIXED = {
  address: 'حولي - قطعة 4 - شارع المعتصم - مركز العيادات التخصصية - الدور السادس',
  phone: 'تلفون: 22650700 داخلي 607',
  mobile: 'موبايل وواتساب: 60008977',
};

// ── UI copy per locale ──
const T = {
  ar: {
    invoiceTitle: 'فاتورة',
    invoiceNo: 'رقم الفاتورة',
    date: 'التاريخ',
    patientInfoTitle: 'بيانات المريضة',
    patientName: 'اسم المريضة',
    visitType: 'نوع الزيارة',
    civilId: 'الرقم المدني',
    diagnosis: 'التشخيص',
    mobileNumber: 'رقم الموبايل',
    doctor: 'الطبيبة',
    service: 'الخدمة',
    code: 'الكود',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة (د.ك)',
    total: 'الإجمالي (د.ك)',
    subtotal: 'المجموع الفرعي',
    paid: 'المدفوع',
    remaining: 'المتبقي',
    paymentStatus: 'حالة الدفع',
    paymentMethod: 'طريقة الدفع',
    thanks: '♥ شكرًا لاختياركم عيادتنا ♥',
    replacementNote: 'تم استبدال هذه الفاتورة. راجع الفاتورة البديلة للتفاصيل الحالية.',
    visitTypeLabels: { CHECKUP: 'كشف', FOLLOW_UP: 'متابعة', OTHER: 'أخرى' },
    paymentStatusLabels: { UNPAID: 'غير مدفوعة', PARTIALLY_PAID: 'مدفوعة جزئيًا', PAID: 'مدفوعة بالكامل' },
    paymentMethodLabels: { CASH: 'نقدًا', VISA: 'فيزا', KNET: 'كي نت', OTHER: 'أخرى' },
    additionalCharge: 'رسوم إضافية',
    fixedCharge: 'رسوم ثابتة',
    dash: '—',
  },
  en: {
    invoiceTitle: 'INVOICE',
    invoiceNo: 'Invoice No.',
    date: 'Date',
    patientInfoTitle: 'PATIENT INFORMATION',
    patientName: 'Patient Name',
    visitType: 'Visit Type',
    civilId: 'Civil ID',
    diagnosis: 'Diagnosis',
    mobileNumber: 'Mobile Number',
    doctor: 'Doctor',
    service: 'SERVICE',
    code: 'CODE',
    qty: 'QTY',
    unitPrice: 'UNIT PRICE (KD)',
    total: 'TOTAL (KD)',
    subtotal: 'Subtotal',
    paid: 'Paid',
    remaining: 'Remaining',
    paymentStatus: 'PAYMENT STATUS',
    paymentMethod: 'PAYMENT METHOD',
    thanks: '♥ Thank you for choosing our clinic ♥',
    replacementNote: 'This invoice has been replaced. See replacement invoice for current details.',
    visitTypeLabels: { CHECKUP: 'Checkup', FOLLOW_UP: 'Follow-up', OTHER: 'Other' },
    paymentStatusLabels: { UNPAID: 'UNPAID', PARTIALLY_PAID: 'PARTIALLY PAID', PAID: 'PAID' },
    paymentMethodLabels: { CASH: 'CASH', VISA: 'VISA', KNET: 'KNET', OTHER: 'OTHER' },
    additionalCharge: 'Additional Charge',
    fixedCharge: 'Fixed Charge',
    dash: '—',
  },
} as const;

function formatMoney(value: number | string): string {
  // Matches the approved design exactly (2 decimals), even though KWD is
  // normally quoted to 3 — an explicit, deliberate choice for this invoice.
  return Number(value).toFixed(2);
}

function formatDate(value: string | Date): string {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Inline SVG icons (feather-style, stroke-based) ──
// Headless Chromium in the Docker image has no color-emoji font installed,
// so the Unicode emoji (📄📅👤...) this template used to render with just
// showed up as empty boxes. Plain SVG paths need no font at all, so they
// render identically everywhere Puppeteer runs.
const ICON_PATHS: Record<string, string> = {
  document:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  clipboard:
    '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  heart:
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  stethoscope: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  wallet:
    '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
};

function icon(name: keyof typeof ICON_PATHS, size = 14): string {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}

export function renderInvoiceHtml(invoice: InvoicePdfData, locale: InvoiceLocale = 'ar'): string {
  const t = T[locale];
  const fixed = FIXED[locale];
  const isRtl = locale === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const itemsRows = invoice.invoiceItems
    .map(
      (item) => `
        <tr>
          <td class="col-service">${escapeHtml(item.serviceNameSnapshot)}</td>
          <td class="col-code">${item.service?.code ? escapeHtml(item.service.code) : t.dash}</td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-price">${formatMoney(item.unitPriceSnapshot)}</td>
          <td class="col-total">${formatMoney(item.lineTotal)}</td>
        </tr>`,
    )
    .join('');

  const chargesRows = (invoice.additionalCharges || [])
    .map((charge) => {
      const chargeLabel = charge.description
        ? escapeHtml(charge.description)
        : charge.chargeType === 'PERCENTAGE'
          ? t.additionalCharge
          : t.fixedCharge;
      const priceDisplay =
        charge.chargeType === 'PERCENTAGE' ? formatMoney(charge.chargeValue) + '%' : formatMoney(charge.chargeValue);
      return `
        <tr class="charge-row">
          <td class="col-service">${chargeLabel}</td>
          <td class="col-code">${t.dash}</td>
          <td class="col-qty">1</td>
          <td class="col-price">${priceDisplay}</td>
          <td class="col-total">${formatMoney(charge.calculatedAmount)}</td>
        </tr>`;
    })
    .join('');

  const chargesTotalsRows = (invoice.additionalCharges || [])
    .map((charge) => {
      const chargeLabel =
        charge.description || (charge.chargeType === 'PERCENTAGE' ? t.additionalCharge : t.fixedCharge);
      const valueDisplay =
        charge.chargeType === 'PERCENTAGE' ? formatMoney(charge.chargeValue) + '%' : formatMoney(charge.chargeValue);
      return `<div class="row"><span>${escapeHtml(chargeLabel)} (${valueDisplay})</span><span class="value">${formatMoney(charge.calculatedAmount)} KD</span></div>`;
    })
    .join('');

  const lastPayment = invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1] : null;

  const voidWatermark = invoice.status === 'VOID' ? `<div class="watermark">VOID</div>` : '';

  const replacementNote = invoice.replacedByInvoiceId
    ? `<div class="replacement-note">${t.replacementNote}</div>`
    : '';

  const visitTypeLabel = invoice.visit ? t.visitTypeLabels[invoice.visit.type] : t.dash;
  const diagnosis = invoice.visit?.diagnosis ? escapeHtml(invoice.visit.diagnosis) : t.dash;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: ${isRtl ? "'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif" : "Arial, 'Noto Sans Arabic', sans-serif"};
    color: #1F2430;
    margin: 0;
    padding: 0;
    background: #FFFFFF;
    position: relative;
  }
  .ico { display: inline-block; vertical-align: middle; flex-shrink: 0; }
  .page {
    padding: 12px 22px 14px;
    border: 1px solid #111844;
    margin: 4px;
  }
  .watermark {
    position: fixed;
    top: 40%;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 96px;
    font-weight: bold;
    color: #C4362B;
    opacity: 0.15;
    transform: rotate(-25deg);
    z-index: 10;
  }
  .top-bar { height: 4px; background: #111844; margin: -12px -22px 10px; }
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
    padding-bottom: 7px;
    border-bottom: 3px double #111844;
    margin-bottom: 7px;
  }
  .header .logo { width: 44px; height: 44px; flex-shrink: 0; }
  .header .clinic-name-primary {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #111844;
  }
  .header .clinic-name-secondary { font-size: 11px; color: #4B5694; margin-top: 1px; }
  .doctor-block { text-align: center; margin-bottom: 7px; }
  .doctor-block .doctor-name {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 12px;
    font-weight: bold;
    color: #1F2430;
  }
  .doctor-block .doctor-title {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 10px;
    color: #4B5694;
    margin-top: 1px;
  }
  .invoice-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    color: #111844;
    letter-spacing: 2px;
    margin: 7px 0 8px;
  }
  .invoice-title .arrow { color: #4B5694; font-weight: normal; padding: 0 10px; }
  .meta-box {
    display: flex;
    border: 1px solid #111844;
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
  }
  .meta-box .cell { flex: 1; padding: 5px 12px; display: flex; align-items: center; gap: 7px; }
  .meta-box .cell:first-child { border-inline-end: 1px solid #E5E7EF; }
  .meta-box .cell .ico { color: #111844; }
  .meta-box .cell .label { font-size: 9px; color: #8991A6; display: block; }
  .meta-box .cell .value { font-size: 12px; font-weight: bold; color: #111844; }
  .patient-box { position: relative; border: 1px solid #111844; border-radius: 8px; padding: 11px 14px 9px; margin-bottom: 8px; }
  .patient-box .connector {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #EAF0FB;
    border: 1px solid #111844;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111844;
  }
  .patient-box .patient-title {
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: #111844;
    letter-spacing: 1px;
    margin-bottom: 7px;
    padding-bottom: 5px;
    border-bottom: 1px solid #E5E7EF;
  }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
  .patient-grid .field { display: flex; align-items: flex-start; gap: 7px; }
  .patient-grid .field .ico { color: #111844; margin-top: 1px; }
  .patient-grid .field .label { font-size: 9px; color: #8991A6; margin-bottom: 1px; }
  .patient-grid .field .value { font-size: 12px; font-weight: bold; color: #1F2430; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.items th { background: #111844; color: #FFFFFF; padding: 5px 8px; font-size: 10px; text-align: ${isRtl ? 'right' : 'left'}; }
  table.items td { padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #E5E7EF; }
  table.items tr:nth-child(even) td { background: #F6F7FA; }
  table.items tr.charge-row td { background: #FFF3E0; font-style: italic; }
  .col-qty, .col-price, .col-total, .col-code { text-align: center; }
  table.items th.col-qty, table.items th.col-price, table.items th.col-total, table.items th.col-code { text-align: center; }
  .replacement-note {
    text-align: center; font-size: 11px; color: #C4362B; font-weight: bold;
    margin-bottom: 10px; padding: 6px; border: 1px solid #C4362B; border-radius: 4px; background: #FEF2F2;
  }
  .bottom-row { display: flex; gap: 12px; margin-bottom: 8px; page-break-inside: avoid; }
  .totals-box {
    flex: 1; border: 1px solid #111844; border-radius: 8px; padding: 7px 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .totals-box .totals-icon {
    width: 26px; height: 26px; border-radius: 50%; background: #EAF0FB; color: #111844;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .totals-box .totals-rows { flex: 1; }
  .totals-box .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; color: #1F2430; }
  .totals-box .row.remaining .value { color: #C4362B; font-weight: bold; }
  .totals-box .row .value { font-weight: bold; }
  .status-row { display: flex; gap: 8px; flex: 1; }
  .status-box { flex: 1; border: 1px solid #111844; border-radius: 8px; padding: 7px 8px; text-align: center; }
  .status-box .label { font-size: 9px; color: #8991A6; margin-bottom: 3px; letter-spacing: 0.5px; }
  .status-box .value { font-size: 12px; font-weight: bold; color: #111844; }
  .thanks { text-align: center; font-style: italic; font-size: 11px; color: #4B5694; margin-bottom: 7px; }
  .footer-box { border: 1px solid #111844; border-radius: 8px; padding: 7px 14px; text-align: center; font-size: 9px; color: #4B5694; page-break-inside: avoid; }
  .footer-box .clinic-name-primary {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 11px; font-weight: bold; color: #111844; margin-bottom: 1px;
  }
  .footer-box .clinic-name-secondary { font-size: 10px; font-weight: bold; color: #111844; margin-bottom: 4px; }
  .footer-box .line { margin-bottom: 1px; }
</style>
</head>
<body>
  ${voidWatermark}
  <div class="page">
    <div class="top-bar"></div>

    <div class="header">
      <img class="logo" src="data:image/png;base64,${CLINIC_LOGO_BASE64}" alt="${fixed.clinicNameLine1}" />
      <div>
        <div class="clinic-name-primary">${fixed.clinicNameLine1}</div>
        <div class="clinic-name-secondary">${fixed.clinicNameLine2}</div>
      </div>
    </div>

    <!-- Doctor name/title are always Arabic, regardless of invoice locale. -->
    <div class="doctor-block">
      <div class="doctor-name">${DOCTOR_FIXED.doctorName}</div>
      <div class="doctor-title">${DOCTOR_FIXED.doctorTitle}</div>
    </div>

    <div class="invoice-title"><span class="arrow">${isRtl ? '&#8592;' : '&#8594;'}</span>${t.invoiceTitle}<span class="arrow">${isRtl ? '&#8594;' : '&#8592;'}</span></div>

    <div class="meta-box">
      <div class="cell">
        ${icon('document')}
        <div><span class="label">${t.invoiceNo}</span><span class="value">${escapeHtml(invoice.invoiceNumber)}</span></div>
      </div>
      <div class="cell">
        ${icon('calendar')}
        <div><span class="label">${t.date}</span><span class="value">${formatDate(invoice.issuedAt || invoice.createdAt)}</span></div>
      </div>
    </div>

    <div class="patient-box">
      <div class="connector">${icon('user', 13)}</div>
      <div class="patient-title">${t.patientInfoTitle}</div>
      <div class="patient-grid">
        <div class="field">
          ${icon('user')}
          <div><div class="label">${t.patientName}</div><div class="value">${escapeHtml(invoice.patient.fullNameAr)}</div></div>
        </div>
        <div class="field">
          ${icon('clipboard')}
          <div><div class="label">${t.visitType}</div><div class="value">${visitTypeLabel}</div></div>
        </div>
        <div class="field">
          ${icon('card')}
          <div><div class="label">${t.civilId}</div><div class="value">${escapeHtml(invoice.patient.civilId)}</div></div>
        </div>
        <div class="field">
          ${icon('heart')}
          <div><div class="label">${t.diagnosis}</div><div class="value">${diagnosis}</div></div>
        </div>
        <div class="field">
          ${icon('phone')}
          <div><div class="label">${t.mobileNumber}</div><div class="value">${invoice.patient.phone ? escapeHtml(invoice.patient.phone) : t.dash}</div></div>
        </div>
        <div class="field">
          ${icon('stethoscope')}
          <!-- Doctor name is always Arabic here too, regardless of invoice locale. -->
          <div><div class="label">${t.doctor}</div><div class="value">${DOCTOR_FIXED.doctorName}</div></div>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="col-service">${t.service}</th>
          <th class="col-code">${t.code}</th>
          <th class="col-qty">${t.qty}</th>
          <th class="col-price">${t.unitPrice}</th>
          <th class="col-total">${t.total}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        ${chargesRows}
      </tbody>
    </table>

    ${replacementNote}

    <div class="bottom-row">
      <div class="totals-box">
        <div class="totals-icon">${icon('wallet', 16)}</div>
        <div class="totals-rows">
          <div class="row"><span>${t.subtotal}</span><span class="value">${formatMoney(invoice.subtotal)} KD</span></div>
          ${chargesTotalsRows}
          <div class="row" style="border-top: 1px solid #E5E7EF; padding-top: 6px; margin-top: 4px;"><span>${t.total}</span><span class="value">${formatMoney(invoice.total)} KD</span></div>
          <div class="row"><span>${t.paid}</span><span class="value">${formatMoney(invoice.paid)} KD</span></div>
          <div class="row remaining"><span>${t.remaining}</span><span class="value">${formatMoney(invoice.remaining)} KD</span></div>
        </div>
      </div>
      <div class="status-row">
        <div class="status-box">
          <div class="label">${t.paymentStatus}</div>
          <div class="value">${t.paymentStatusLabels[invoice.paymentStatus]}</div>
        </div>
        <div class="status-box">
          <div class="label">${t.paymentMethod}</div>
          <div class="value">${lastPayment ? t.paymentMethodLabels[lastPayment.method] : t.dash}</div>
        </div>
      </div>
    </div>

    <div class="thanks">${t.thanks}</div>

    <!-- Address / phone / mobile are always Arabic, regardless of invoice locale. -->
    <div class="footer-box">
      <div class="clinic-name-primary">${fixed.clinicNameLine1}</div>
      <div class="clinic-name-secondary">${fixed.clinicNameLine2}</div>
      <div class="line">${CONTACT_FIXED.address}</div>
      <div class="line">${CONTACT_FIXED.phone}</div>
      <div class="line">${CONTACT_FIXED.mobile}</div>
    </div>
  </div>
</body>
</html>`;
}

// ── WhatsApp share link (frontend opens this in a new tab / window.open) ──
// This only pre-fills a message; WhatsApp does not allow attaching a file via
// a wa.me link for security reasons, so the user still has to attach the
// downloaded PDF manually inside the chat that opens.
export function buildWhatsAppShareUrl(
  patientPhone: string,
  invoiceNumber: string,
  locale: InvoiceLocale = 'ar',
): string {
  const digitsOnly = patientPhone.replace(/[^\d]/g, '');
  const message =
    locale === 'ar'
      ? `مرفق فاتورتكم رقم ${invoiceNumber} من مركز العيادات التخصصية.`
      : `Attached is your invoice No. ${invoiceNumber} from Specialized Clinics Center.`;
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

