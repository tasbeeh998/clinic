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
// NOTE: verify the English doctor-name transliteration below — only the Arabic
// spelling was confirmed ("د. نداء بوخضور", without "محمد").
const FIXED: Record<InvoiceLocale, {
  doctorName: string;
  doctorTitle: string;
  clinicNameLine1: string;
  clinicNameLine2: string;
  address: string;
  phone: string;
  mobile: string;
}> = {
  ar: {
    doctorName: 'د. نداء بوخضور',
    doctorTitle: 'استشاري أمراض النساء والولادة والعقم',
    clinicNameLine1: 'مركز العيادات التخصصية',
    clinicNameLine2: 'Specialized Clinics Center',
    address: 'حولي - قطعة 4 - شارع المعتصم - مركز العيادات التخصصية - الدور السادس',
    phone: 'تلفون: 22650700 داخلي 607',
    mobile: 'موبايل وواتساب: 60008977',
  },
  en: {
    doctorName: 'Dr. Nedaa Bukhdour', // TODO: confirm exact English spelling
    doctorTitle: 'Consultant Obstetrician, Gynecologist & Fertility Specialist',
    clinicNameLine1: 'Specialized Clinics Center',
    clinicNameLine2: 'مركز العيادات التخصصية',
    address: "Hawally - Block 4 - Al-Mu'tasim Street - Specialized Clinics Center - 6th Floor",
    phone: 'Tel.: 22650700 Ext. 607',
    mobile: 'Mobile & WhatsApp: 60008977',
  },
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
  .page {
    padding: 32px 40px 40px;
    border: 1px solid #111844;
    margin: 16px;
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
  .top-bar { height: 6px; background: #111844; margin: -32px -40px 24px; }
  .header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-bottom: 16px;
    border-bottom: 3px double #111844;
    margin-bottom: 16px;
  }
  .header .logo { width: 80px; height: 80px; flex-shrink: 0; }
  .header .clinic-name-primary {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 24px;
    font-weight: bold;
    color: #111844;
  }
  .header .clinic-name-secondary { font-size: 16px; color: #4B5694; margin-top: 2px; }
  .doctor-block { text-align: center; margin-bottom: 18px; }
  .doctor-block .doctor-name {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #1F2430;
  }
  .doctor-block .doctor-title {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 13px;
    color: #4B5694;
    margin-top: 2px;
  }
  .invoice-title {
    text-align: center;
    font-size: 26px;
    font-weight: bold;
    color: #111844;
    letter-spacing: 2px;
    margin: 18px 0 20px;
  }
  .invoice-title .arrow { color: #4B5694; font-weight: normal; padding: 0 10px; }
  .meta-box {
    display: flex;
    border: 1px solid #111844;
    border-radius: 8px;
    margin-bottom: 18px;
    overflow: hidden;
  }
  .meta-box .cell { flex: 1; padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
  .meta-box .cell:first-child { border-inline-end: 1px solid #E5E7EF; }
  .meta-box .cell .icon { color: #111844; font-size: 16px; }
  .meta-box .cell .label { font-size: 11px; color: #8991A6; display: block; }
  .meta-box .cell .value { font-size: 14px; font-weight: bold; color: #111844; }
  .patient-box { position: relative; border: 1px solid #111844; border-radius: 8px; padding: 20px 20px 16px; margin-bottom: 18px; }
  .patient-box .connector {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #EAF0FB;
    border: 1px solid #111844;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .patient-box .patient-title {
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #111844;
    letter-spacing: 1px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #E5E7EF;
  }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
  .patient-grid .field { display: flex; align-items: flex-start; gap: 8px; }
  .patient-grid .field .icon { color: #111844; font-size: 15px; margin-top: 1px; }
  .patient-grid .field .label { font-size: 11px; color: #8991A6; margin-bottom: 2px; }
  .patient-grid .field .value { font-size: 14px; font-weight: bold; color: #1F2430; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.items th { background: #111844; color: #FFFFFF; padding: 9px 10px; font-size: 12px; text-align: ${isRtl ? 'right' : 'left'}; }
  table.items td { padding: 9px 10px; font-size: 13px; border-bottom: 1px solid #E5E7EF; }
  table.items tr:nth-child(even) td { background: #F6F7FA; }
  table.items tr.charge-row td { background: #FFF3E0; font-style: italic; }
  .col-qty, .col-price, .col-total, .col-code { text-align: center; }
  table.items th.col-qty, table.items th.col-price, table.items th.col-total, table.items th.col-code { text-align: center; }
  .replacement-note {
    text-align: center; font-size: 12px; color: #C4362B; font-weight: bold;
    margin-bottom: 12px; padding: 8px; border: 1px solid #C4362B; border-radius: 4px; background: #FEF2F2;
  }
  .bottom-row { display: flex; gap: 20px; margin-bottom: 18px; }
  .totals-box {
    flex: 1; border: 1px solid #111844; border-radius: 8px; padding: 14px 18px;
    display: flex; align-items: center; gap: 16px;
  }
  .totals-box .totals-icon {
    width: 40px; height: 40px; border-radius: 50%; background: #EAF0FB;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  .totals-box .totals-rows { flex: 1; }
  .totals-box .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; color: #1F2430; }
  .totals-box .row.remaining .value { color: #C4362B; font-weight: bold; }
  .totals-box .row .value { font-weight: bold; }
  .status-row { display: flex; gap: 12px; flex: 1; }
  .status-box { flex: 1; border: 1px solid #111844; border-radius: 8px; padding: 14px 12px; text-align: center; }
  .status-box .label { font-size: 11px; color: #8991A6; margin-bottom: 6px; letter-spacing: 0.5px; }
  .status-box .value { font-size: 15px; font-weight: bold; color: #111844; }
  .thanks { text-align: center; font-style: italic; font-size: 13px; color: #4B5694; margin-bottom: 18px; }
  .footer-box { border: 1px solid #111844; border-radius: 8px; padding: 14px 20px; text-align: center; font-size: 11px; color: #4B5694; }
  .footer-box .clinic-name-primary {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 14px; font-weight: bold; color: #111844; margin-bottom: 2px;
  }
  .footer-box .clinic-name-secondary { font-size: 12px; font-weight: bold; color: #111844; margin-bottom: 8px; }
  .footer-box .line { margin-bottom: 2px; }
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

    <div class="doctor-block">
      <div class="doctor-name">${fixed.doctorName}</div>
      <div class="doctor-title">${fixed.doctorTitle}</div>
    </div>

    <div class="invoice-title"><span class="arrow">${isRtl ? '&#8592;' : '&#8594;'}</span>${t.invoiceTitle}<span class="arrow">${isRtl ? '&#8594;' : '&#8592;'}</span></div>

    <div class="meta-box">
      <div class="cell">
        <span class="icon">&#128196;</span>
        <div><span class="label">${t.invoiceNo}</span><span class="value">${escapeHtml(invoice.invoiceNumber)}</span></div>
      </div>
      <div class="cell">
        <span class="icon">&#128197;</span>
        <div><span class="label">${t.date}</span><span class="value">${formatDate(invoice.issuedAt || invoice.createdAt)}</span></div>
      </div>
    </div>

    <div class="patient-box">
      <div class="connector">&#128100;</div>
      <div class="patient-title">${t.patientInfoTitle}</div>
      <div class="patient-grid">
        <div class="field">
          <span class="icon">&#128100;</span>
          <div><div class="label">${t.patientName}</div><div class="value">${escapeHtml(invoice.patient.fullNameAr)}</div></div>
        </div>
        <div class="field">
          <span class="icon">&#128203;</span>
          <div><div class="label">${t.visitType}</div><div class="value">${visitTypeLabel}</div></div>
        </div>
        <div class="field">
          <span class="icon">&#127380;</span>
          <div><div class="label">${t.civilId}</div><div class="value">${escapeHtml(invoice.patient.civilId)}</div></div>
        </div>
        <div class="field">
          <span class="icon">&#10084;&#65039;</span>
          <div><div class="label">${t.diagnosis}</div><div class="value">${diagnosis}</div></div>
        </div>
        <div class="field">
          <span class="icon">&#128222;</span>
          <div><div class="label">${t.mobileNumber}</div><div class="value">${invoice.patient.phone ? escapeHtml(invoice.patient.phone) : t.dash}</div></div>
        </div>
        <div class="field">
          <span class="icon">&#129658;</span>
          <div><div class="label">${t.doctor}</div><div class="value">${fixed.doctorName}</div></div>
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
        <div class="totals-icon">&#128179;</div>
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

    <div class="footer-box">
      <div class="clinic-name-primary">${fixed.clinicNameLine1}</div>
      <div class="clinic-name-secondary">${fixed.clinicNameLine2}</div>
      <div class="line">${fixed.address}</div>
      <div class="line">${fixed.phone}</div>
      <div class="line">${fixed.mobile}</div>
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
