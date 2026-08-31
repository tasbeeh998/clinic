import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, User, Phone, IdCard, Calendar, Stethoscope, FileText, ReceiptText } from 'lucide-react';
import { visitsService, VisitStatus, currentInvoice } from '../services/visits.service';

const STATUS_LABELS: Record<VisitStatus, string> = {
  SCHEDULED: 'قيد الانتظار',
  IN_PROGRESS: 'جارية الآن',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
};

const TYPE_LABELS: Record<string, string> = {
  CHECKUP: 'كشف',
  FOLLOW_UP: 'متابعة',
  OTHER: 'أخرى',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'غير مدفوعة',
  PARTIALLY_PAID: 'مدفوعة جزئيًا',
  PAID: 'مدفوعة بالكامل',
};

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ar-KW', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function VisitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: visit, isLoading, error } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitsService.getVisit(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="ui-card p-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="ui-skeleton h-8 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="page-container">
        <div className="ui-card p-16 text-center text-[#C4362B]">تعذّر تحميل بيانات الزيارة</div>
      </div>
    );
  }

  const activeInvoice = currentInvoice(visit.invoices);

  return (
    <div className="page-container">
      <button onClick={() => navigate('/visits')} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#102F63] mb-4">
        <ArrowRight size={16} strokeWidth={1.75} />
        رجوع للزيارات
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#102F63]">تفاصيل الزيارة</h1>
          <p className="text-sm text-[#64748B] mt-1">{formatDateTime(visit.visitDate)}</p>
        </div>
        <span className="ui-badge" style={{ background: 'rgba(23,59,120,0.1)', color: 'var(--brand-blue)' }}>
          {STATUS_LABELS[visit.status]}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4 flex items-center gap-2">
            <User size={17} strokeWidth={1.75} />
            بيانات المريضة
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <User size={15} strokeWidth={1.75} className="text-[#94A3B8]" />
              <span className="text-[#64748B]">الاسم:</span>
              <span className="font-medium text-[#1F2430]">{visit.patient.fullNameAr}</span>
            </div>
            <div className="flex items-center gap-2">
              <IdCard size={15} strokeWidth={1.75} className="text-[#94A3B8]" />
              <span className="text-[#64748B]">الرقم المدني:</span>
              <span className="font-medium text-[#1F2430] font-mono">{visit.patient.civilId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} strokeWidth={1.75} className="text-[#94A3B8]" />
              <span className="text-[#64748B]">الموبايل:</span>
              <span className="font-medium text-[#1F2430]">{visit.patient.phone || '—'}</span>
            </div>
          </div>
        </div>

        <div className="ui-card p-5">
          <h2 className="text-[15px] font-bold text-[#102F63] mb-4 flex items-center gap-2">
            <Calendar size={17} strokeWidth={1.75} />
            بيانات الزيارة
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">التاريخ والوقت:</span>
              <span className="font-medium text-[#1F2430]">{formatDateTime(visit.visitDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">نوع الزيارة:</span>
              <span className="font-medium text-[#1F2430]">{TYPE_LABELS[visit.type]}</span>
            </div>
            {visit.diagnosis && (
              <div className="flex items-start gap-2">
                <span className="text-[#64748B] shrink-0">التشخيص:</span>
                <span className="font-medium text-[#1F2430]">{visit.diagnosis}</span>
              </div>
            )}
            {visit.notes && (
              <div className="flex items-start gap-2">
                <span className="text-[#64748B] shrink-0">ملاحظات:</span>
                <span className="text-[#1F2430]">{visit.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ui-card p-5 mb-5">
        <h2 className="text-[15px] font-bold text-[#102F63] mb-4 flex items-center gap-2">
          <Stethoscope size={17} strokeWidth={1.75} />
          الخدمات
        </h2>
        {activeInvoice ? (
          <ul className="space-y-2">
            {activeInvoice.invoiceItems.map((item, i: number) => (
                  <li key={i} className="text-sm text-[#1F2430] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#102F63]" />
                    {item.serviceNameSnapshot}
                  </li>
                ))}
          </ul>
        ) : (
          <p className="text-sm text-[#94A3B8]">لا توجد خدمات مسجلة بعد لهذه الزيارة (لسه ما اتعملتش فاتورة).</p>
        )}
      </div>

      <div className="ui-card p-5">
        <h2 className="text-[15px] font-bold text-[#102F63] mb-4 flex items-center gap-2">
          <FileText size={17} strokeWidth={1.75} />
          الفاتورة
        </h2>
        {activeInvoice ? (
          <>
                <div key={activeInvoice.id}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-[#94A3B8] text-xs mb-1">رقم الفاتورة</div>
                      <div className="font-medium text-[#1F2430]">{activeInvoice.invoiceNumber}</div>
                    </div>
                    <div>
                      <div className="text-[#94A3B8] text-xs mb-1">الإجمالي</div>
                      <div className="font-medium text-[#1F2430]">{parseFloat(activeInvoice.total).toFixed(2)} د.ك</div>
                    </div>
                    <div>
                      <div className="text-[#94A3B8] text-xs mb-1">المدفوع</div>
                      <div className="font-medium text-[#1F2430]">{parseFloat(activeInvoice.paid).toFixed(2)} د.ك</div>
                    </div>
                    <div>
                      <div className="text-[#94A3B8] text-xs mb-1">المتبقي</div>
                      <div className="font-medium text-[#C4362B]">{parseFloat(activeInvoice.remaining).toFixed(2)} د.ك</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="ui-badge" style={{ background: 'rgba(23,59,120,0.08)', color: 'var(--brand-blue)' }}>
                      {PAYMENT_STATUS_LABELS[activeInvoice.paymentStatus]}
                    </span>
                    <button onClick={() => navigate(`/invoices/${activeInvoice.id}`)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
                      <ReceiptText size={16} strokeWidth={1.75} />
                      عرض الفاتورة
                    </button>
                  </div>
                </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#94A3B8]">لسه معملتش فاتورة لهذه الزيارة.</p>
            <button onClick={() => navigate(`/invoices/new?visitId=${visit.id}`)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <ReceiptText size={16} strokeWidth={1.75} />
              إنشاء فاتورة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
