import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { servicesService, Service } from '../services/services.service';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-KW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ServicesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Service | null>(null);
  const limit = 20;

  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['services', search, isActiveFilter, page],
    queryFn: () => servicesService.getServices(search, isActiveFilter, page, limit),
  });

  const services = data?.data || [];
  const meta = data?.meta;

  const handleToggleStatus = async (service: Service) => {
    try {
      await servicesService.updateServiceStatus(service.id, { isActive: !service.isActive });
      setConfirmDeactivate(null);
      refetch();
    } catch (err) {
      console.error('Failed to update service status:', err);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#102F63]">الخدمات</h1>
          <p className="text-sm text-[#64748B] mt-1">إدارة الخدمات والأسعار</p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/services/new')} className="btn-primary flex items-center gap-2 px-4">
            <Plus size={18} strokeWidth={2} />
            إضافة خدمة جديدة
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={17} strokeWidth={1.75} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث باسم الخدمة أو الكود..."
            className="ui-input pr-10"
          />
        </div>
        <select
          value={isActiveFilter === undefined ? '' : String(isActiveFilter)}
          onChange={(e) => {
            const value = e.target.value;
            setIsActiveFilter(value === '' ? undefined : value === 'true');
            setPage(1);
          }}
          className="ui-input w-auto"
        >
          <option value="">كل الحالات</option>
          <option value="true">نشطة</option>
          <option value="false">معطّلة</option>
        </select>
      </div>

      {isLoading && (
        <div className="ui-card p-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="ui-skeleton h-11 rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="ui-card p-6 text-center text-[#C4362B] text-sm">فشل في تحميل بيانات الخدمات</div>
      )}

      {!isLoading && !error && services.length === 0 && (
        <div className="ui-card p-16 text-center">
          <p className="text-[#64748B]">{search ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات متاحة حاليًا'}</p>
        </div>
      )}

      {!isLoading && !error && services.length > 0 && (
        <div className="ui-card overflow-hidden p-0">
          <table className="ui-table">
            <thead>
              <tr>
                <th>اسم الخدمة</th>
                <th>كود الخدمة</th>
                <th>السعر (د.ك)</th>
                <th>الحالة</th>
                <th>تاريخ التحديث</th>
                {isAdmin && <th>الإجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="font-medium text-[#1F2430]">{service.name}</div>
                    {service.description && <div className="text-xs text-[#94A3B8]">{service.description}</div>}
                  </td>
                  <td className="font-mono text-[#64748B]">{service.code || '—'}</td>
                  <td className="font-medium text-[#1F2430]">{parseFloat(service.currentPrice).toFixed(2)}</td>
                  <td>
                    <span
                      className="ui-badge"
                      style={
                        service.isActive
                          ? { background: 'rgba(22,128,60,0.1)', color: 'var(--success)' }
                          : { background: 'rgba(100,116,139,0.1)', color: 'var(--text-secondary)' }
                      }
                    >
                      {service.isActive ? 'نشطة' : 'معطّلة'}
                    </span>
                  </td>
                  <td className="text-[#64748B]">{formatDate(service.updatedAt)}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/services/${service.id}/edit`)}
                          aria-label="تعديل الخدمة"
                          className="icon-btn"
                        >
                          <Pencil size={16} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => setConfirmDeactivate(service)}
                          aria-label={service.isActive ? 'تعطيل الخدمة' : 'تفعيل الخدمة'}
                          className="icon-btn danger"
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {meta && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#E2E8F0]">
              <span className="text-[13px] text-[#64748B]">
                عرض {(meta.page - 1) * meta.limit + 1} إلى {Math.min(meta.page * meta.limit, meta.total)} من {meta.total} خدمة
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

      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="ui-card p-6 max-w-sm w-full">
            <h3 className="font-bold text-[#102F63] mb-2">
              {confirmDeactivate.isActive ? 'تعطيل الخدمة' : 'تفعيل الخدمة'}
            </h3>
            <p className="text-sm text-[#64748B] mb-5">
              {confirmDeactivate.isActive
                ? `هل تريدين تعطيل خدمة "${confirmDeactivate.name}"؟ الفواتير السابقة اللي فيها الخدمة دي لن تتأثر، لكن مش هتظهر كخيار عند إنشاء فاتورة جديدة.`
                : `هل تريدين إعادة تفعيل خدمة "${confirmDeactivate.name}"؟`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="px-4 py-2 rounded-[10px] border border-[#E2E8F0] text-sm text-[#64748B]"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleToggleStatus(confirmDeactivate)}
                className={confirmDeactivate.isActive ? 'btn-danger-outline px-4 py-2 text-sm' : 'btn-primary px-4 py-2 text-sm'}
              >
                {confirmDeactivate.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
