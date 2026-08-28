import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Pencil, CalendarPlus, Plus, Filter } from 'lucide-react';
import { patientsService } from '../services/patients.service';

// Masks all but the first and last digit of a civil ID for display in the
// list view only — the full number is still shown on the patient's own
// detail/edit page and on invoices, this is purely an on-screen privacy
// convenience for a shared front-desk monitor.
function maskCivilId(civilId: string): string {
  if (!civilId || civilId.length <= 2) return civilId;
  return civilId[0] + 'X'.repeat(civilId.length - 2) + civilId[civilId.length - 1];
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('ar-KW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function PatientsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isArchived, setIsArchived] = useState<boolean | undefined>(undefined);
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', search, isArchived, page],
    queryFn: () => patientsService.getPatients(search, isArchived, page, limit),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleArchiveFilter = (value: 'all' | 'active' | 'archived') => {
    setIsArchived(value === 'all' ? undefined : value === 'archived');
    setPage(1);
    setShowFilter(false);
  };

  const patients = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#102F63]">المرضى</h1>
          <p className="text-sm text-[#64748B] mt-1">إدارة بيانات المرضى والمريضات</p>
        </div>
        <button onClick={() => navigate('/patients/new')} className="btn-primary flex items-center gap-2 px-4">
          <Plus size={18} strokeWidth={2} />
          إضافة مريض جديد
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={17} strokeWidth={1.75} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="البحث برقم المدني أو اسم أو هاتف..."
            className="ui-input pr-10"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilter((s) => !s)}
            className="h-11 px-4 flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white text-sm text-[#102F63] hover:bg-[#F6F8FC]"
          >
            <Filter size={16} strokeWidth={1.75} />
            فلترة
          </button>
          {showFilter && (
            <div className="absolute left-0 mt-2 w-40 bg-white border border-[#E2E8F0] rounded-[10px] shadow-[var(--shadow-soft-lg)] z-10 overflow-hidden">
              {(['all', 'active', 'archived'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleArchiveFilter(opt)}
                  className={`w-full text-right px-4 py-2.5 text-sm hover:bg-[#F6F8FC] ${
                    (opt === 'all' && isArchived === undefined) ||
                    (opt === 'active' && isArchived === false) ||
                    (opt === 'archived' && isArchived === true)
                      ? 'text-[#102F63] font-semibold bg-[#F6F8FC]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {opt === 'all' ? 'الكل' : opt === 'active' ? 'نشط' : 'مؤرشف'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="ui-card p-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ui-skeleton h-11 rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="ui-card p-6 text-center text-[#C4362B] text-sm">فشل في تحميل بيانات المرضى</div>
      )}

      {!isLoading && !error && patients.length === 0 && (
        <div className="ui-card p-16 text-center">
          <p className="text-[#64748B] mb-4">{search ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات متاحة حاليًا'}</p>
        </div>
      )}

      {!isLoading && !error && patients.length > 0 && (
        <div className="ui-card overflow-hidden p-0">
          <table className="ui-table">
            <thead>
              <tr>
                <th>اسم المريض</th>
                <th>الرقم المدني</th>
                <th>هاتف</th>
                <th>تاريخ آخر زيارة</th>
                <th>الزيارة القادمة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="font-medium text-[#1F2430]">{patient.fullNameAr}</div>
                    {patient.fullNameEn && <div className="text-xs text-[#94A3B8]">{patient.fullNameEn}</div>}
                  </td>
                  <td className="font-mono text-[#64748B]">{maskCivilId(patient.civilId)}</td>
                  <td className="text-[#1F2430]">{patient.phone || '—'}</td>
                  <td className="text-[#64748B]">{formatDate(patient.lastVisitDate)}</td>
                  <td className="text-[#64748B]">{formatDate(patient.nextAppointmentDate)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        aria-label="عرض بيانات المريض"
                        className="icon-btn"
                      >
                        <Eye size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => navigate(`/patients/${patient.id}/edit`)}
                        aria-label="تعديل بيانات المريض"
                        className="icon-btn"
                      >
                        <Pencil size={16} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => navigate('/appointments/new')}
                        aria-label="حجز موعد"
                        className="icon-btn"
                      >
                        <CalendarPlus size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#E2E8F0]">
              <span className="text-[13px] text-[#64748B]">
                عرض {(meta.page - 1) * meta.limit + 1} إلى {Math.min(meta.page * meta.limit, meta.total)} من {meta.total} مريض
              </span>
              {meta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-md border border-[#E2E8F0] text-sm disabled:opacity-40"
                  >
                    السابق
                  </button>
                  <span className="text-sm text-[#102F63] font-medium">{meta.page} / {meta.totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1.5 rounded-md border border-[#E2E8F0] text-sm disabled:opacity-40"
                  >
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
