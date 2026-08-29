import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, ReceiptText, CheckCircle2, Plus } from 'lucide-react';
import { visitsService, VisitStatus } from '../services/visits.service';

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

function statusBadgeStyle(status: VisitStatus) {
  switch (status) {
    case 'COMPLETED':
      return { background: 'rgba(22,128,60,0.1)', color: 'var(--success)' };
    case 'IN_PROGRESS':
      return { background: 'rgba(23,59,120,0.1)', color: 'var(--brand-blue)' };
    case 'CANCELLED':
      return { background: 'rgba(196,54,43,0.1)', color: 'var(--danger)' };
    default:
      return { background: 'rgba(201,130,0,0.1)', color: 'var(--warning)' };
  }
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-KW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function VisitsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: counts } = useQuery({
    queryKey: ['visits-today-counts'],
    queryFn: () => visitsService.getTodayCounts(),
    refetchInterval: 60000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['visits', search, statusFilter, typeFilter, dateFilter, page],
    queryFn: () =>
      visitsService.getVisits(
        undefined,
        undefined,
        typeFilter || undefined,
        (statusFilter || undefined) as VisitStatus | undefined,
        dateFilter || undefined,
        dateFilter || undefined,
        search || undefined,
        page,
        limit,
      ),
  });

  const visits = data?.data || [];
  const meta = data?.meta;

  const handleComplete = async (visitId: string) => {
    try {
      await visitsService.updateVisitStatus(visitId, 'COMPLETED');
      refetch();
    } catch (err) {
      console.error('Failed to complete visit:', err);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#102F63]">الزيارات</h1>
          <p className="text-sm text-[#64748B] mt-1">إدارة ومتابعة زيارات المريضات</p>
        </div>
        <button onClick={() => navigate('/visits/new')} className="btn-primary flex items-center gap-2 px-4">
          <Plus size={18} strokeWidth={2} />
          تسجيل زيارة جديدة
        </button>
      </div>

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'زيارات اليوم', value: counts.total, color: '#102F63' },
            { label: 'قيد الانتظار', value: counts.scheduled, color: 'var(--warning)' },
            { label: 'جارية الآن', value: counts.inProgress, color: 'var(--brand-blue)' },
            { label: 'مكتملة', value: counts.completed, color: 'var(--success)' },
            { label: 'ملغاة', value: counts.cancelled, color: 'var(--danger)' },
          ].map((c) => (
            <div key={c.label} className="ui-card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs text-[#64748B] mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={17} strokeWidth={1.75} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="البحث باسم المريضة أو الرقم المدني..."
            className="ui-input pr-10"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="ui-input w-auto"
        />
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="ui-input w-auto">
          <option value="">كل الأنواع</option>
          <option value="CHECKUP">كشف</option>
          <option value="FOLLOW_UP">متابعة</option>
          <option value="OTHER">أخرى</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as VisitStatus | ''); setPage(1); }}
          className="ui-input w-auto"
        >
          <option value="">كل الحالات</option>
          {(Object.keys(STATUS_LABELS) as VisitStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="ui-card p-6 space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="ui-skeleton h-11 rounded-lg" />)}
        </div>
      )}

      {error && <div className="ui-card p-6 text-center text-[#C4362B] text-sm">فشل في تحميل بيانات الزيارات</div>}

      {!isLoading && !error && visits.length === 0 && (
        <div className="ui-card p-16 text-center">
          <p className="text-[#64748B]">لا توجد بيانات متاحة حاليًا</p>
        </div>
      )}

      {!isLoading && !error && visits.length > 0 && (
        <div className="ui-card overflow-hidden p-0">
          <table className="ui-table">
            <thead>
              <tr>
                <th>الوقت</th>
                <th>المريضة</th>
                <th>الرقم المدني</th>
                <th>نوع الزيارة</th>
                <th>الخدمات</th>
                <th>الفاتورة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="text-[#64748B]">
                    {formatTime(visit.visitDate)}
                    <div className="text-xs text-[#94A3B8]">{formatDate(visit.visitDate)}</div>
                  </td>
                  <td className="font-medium text-[#1F2430]">{visit.patient.fullNameAr}</td>
                  <td className="font-mono text-[#64748B]">{visit.patient.civilId[0]}{'X'.repeat(Math.max(0, visit.patient.civilId.length - 2))}{visit.patient.civilId.slice(-1)}</td>
                  <td className="text-[#1F2430]">{TYPE_LABELS[visit.type]}</td>
                  <td className="text-[#64748B] text-sm">
                    {visit.invoice?.invoiceItems.length
                      ? visit.invoice.invoiceItems.map((i) => i.serviceNameSnapshot).join('، ')
                      : '—'}
                  </td>
                  <td className="text-[#64748B]">{visit.invoice?.invoiceNumber || '—'}</td>
                  <td>
                    <span className="ui-badge" style={statusBadgeStyle(visit.status)}>
                      {STATUS_LABELS[visit.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(`/visits/${visit.id}`)} aria-label="عرض تفاصيل الزيارة" className="icon-btn">
                        <Eye size={16} strokeWidth={1.75} />
                      </button>
                      {visit.invoice && (
                        <button onClick={() => navigate(`/invoices/${visit.invoice!.id}`)} aria-label="عرض الفاتورة" className="icon-btn">
                          <ReceiptText size={16} strokeWidth={1.75} />
                        </button>
                      )}
                      {(visit.status === 'SCHEDULED' || visit.status === 'IN_PROGRESS') && (
                        <button onClick={() => handleComplete(visit.id)} aria-label="إنهاء الزيارة" className="icon-btn">
                          <CheckCircle2 size={16} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#E2E8F0]">
              <span className="text-[13px] text-[#64748B]">
                عرض {(meta.page - 1) * meta.limit + 1} إلى {Math.min(meta.page * meta.limit, meta.total)} من {meta.total} زيارة
              </span>
              {meta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md border border-[#E2E8F0] text-sm disabled:opacity-40">
                    السابق
                  </button>
                  <span className="text-sm text-[#102F63] font-medium">{meta.page} / {meta.totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1.5 rounded-md border border-[#E2E8F0] text-sm disabled:opacity-40">
                    التالي
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
