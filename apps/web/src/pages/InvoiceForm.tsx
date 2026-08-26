import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { visitsService } from '../services/visits.service';
import { servicesService } from '../services/services.service';
import { invoicesService } from '../services/invoices.service';

interface LineItem {
  serviceId: string;
  quantity: number;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visitId') || '';

  const [items, setItems] = useState<LineItem[]>([{ serviceId: '', quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);

  const { data: visit, isLoading: visitLoading } = useQuery({
    queryKey: ['visit', visitId],
    queryFn: () => visitsService.getVisit(visitId),
    enabled: !!visitId,
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => servicesService.getActiveServices(),
  });

  const services = servicesData?.data || [];

  const createMutation = useMutation({
    mutationFn: invoicesService.createInvoice,
    onSuccess: (invoice) => {
      navigate(`/invoices/${invoice.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const addLine = () => setItems([...items, { serviceId: '', quantity: 1 }]);

  const removeLine = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const total = items.reduce((sum, item) => {
    const service = services.find((s) => s.id === item.serviceId);
    if (!service) return sum;
    return sum + parseFloat(service.currentPrice) * (item.quantity || 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.serviceId && i.quantity > 0);
    if (validItems.length === 0) {
      setError('أضف خدمة واحدة على الأقل');
      return;
    }
    if (!visitId) {
      setError('لا يمكن إنشاء فاتورة بدون زيارة مرتبطة');
      return;
    }

    createMutation.mutate({ visitId, items: validItems });
  };

  if (!visitId) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            لا يمكن إنشاء فاتورة بدون تحديد الزيارة. الرجاء البدء من صفحة الزيارة.
          </div>
        </div>
      </div>
    );
  }

  if (visitLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-[#111844] mb-6">فاتورة جديدة</h1>

        {visit && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="text-sm text-gray-500">المريض</div>
            <div className="text-lg font-medium text-gray-900">{visit.patient.fullNameAr}</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4 mb-4">
            {items.map((item, index) => {
              const service = services.find((s) => s.id === item.serviceId);
              return (
                <div key={index} className="flex gap-3 items-start">
                  <select
                    value={item.serviceId}
                    onChange={(e) => updateLine(index, 'serviceId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                    required
                  >
                    <option value="">اختر الخدمة...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {parseFloat(s.currentPrice).toFixed(3)} د.ك
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                  />
                  <div className="w-24 pt-2 text-gray-700 text-sm">
                    {service ? (parseFloat(service.currentPrice) * item.quantity).toFixed(3) : '0.000'} د.ك
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="text-[#C4362B] hover:text-[#a32b22] px-2"
                    >
                      حذف
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="text-[#4B5694] hover:text-[#111844] text-sm mb-6"
          >
            + إضافة خدمة أخرى
          </button>

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center mb-6">
            <span className="text-lg font-bold text-[#111844]">الإجمالي</span>
            <span className="text-lg font-bold text-[#111844]">{total.toFixed(3)} د.ك</span>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الفاتورة'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
