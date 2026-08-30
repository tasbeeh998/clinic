import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { visitsService } from '../services/visits.service';
import { servicesService } from '../services/services.service';
import { invoicesService } from '../services/invoices.service';

interface LineItem {
  serviceId: string;
  quantity: number;
  unitPrice: number | null; // null until a service is picked or the user edits it
}

interface AdditionalCharge {
  chargeType: 'PERCENTAGE' | 'FIXED';
  chargeValue: number;
  description: string;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visitId') || '';

  const [items, setItems] = useState<LineItem[]>([{ serviceId: '', quantity: 1, unitPrice: null }]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
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

  const addLine = () => setItems([...items, { serviceId: '', quantity: 1, unitPrice: null }]);

  const removeLine = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateLine = (index: number, field: keyof LineItem, value: string | number | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value } as LineItem;

    // When a service is selected (or changed), default its price into unitPrice —
    // this is just the starting value, the receptionist can still edit it below
    // before submitting. It never touches the service's own default price.
    if (field === 'serviceId') {
      const service = services.find((s) => s.id === value);
      updated[index].unitPrice = service ? parseFloat(service.currentPrice) : null;
    }

    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => {
    const service = services.find((s) => s.id === item.serviceId);
    if (!service) return sum;
    const price = item.unitPrice !== null ? item.unitPrice : parseFloat(service.currentPrice);
    return sum + price * (item.quantity || 0);
  }, 0);

  const totalCharges = additionalCharges.reduce((sum, charge) => {
    if (charge.chargeType === 'PERCENTAGE') {
      return sum + (subtotal * charge.chargeValue) / 100;
    } else {
      return sum + charge.chargeValue;
    }
  }, 0);

  const total = subtotal + totalCharges;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items
      .filter((i) => i.serviceId && i.quantity > 0)
      .map((i) => ({
        serviceId: i.serviceId,
        quantity: i.quantity,
        // Only send an override when it actually differs from the service's
        // own default price — omitting it otherwise keeps existing behavior
        // (backend falls back to the service's currentPrice automatically).
        ...(i.unitPrice !== null &&
        i.unitPrice !== parseFloat(services.find((s) => s.id === i.serviceId)?.currentPrice || '0')
          ? { unitPrice: i.unitPrice }
          : {}),
      }));
    if (validItems.length === 0) {
      setError('أضف خدمة واحدة على الأقل');
      return;
    }
    if (!visitId) {
      setError('لا يمكن إنشاء فاتورة بدون زيارة مرتبطة');
      return;
    }

    createMutation.mutate({ 
      visitId, 
      items: validItems,
      additionalCharges: additionalCharges.length > 0 ? additionalCharges : undefined,
    });
  };

  const addCharge = () => {
    setAdditionalCharges([...additionalCharges, { chargeType: 'FIXED', chargeValue: 0, description: '' }]);
  };

  const removeCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const updateCharge = (index: number, field: keyof AdditionalCharge, value: string | number) => {
    const updated = [...additionalCharges];
    updated[index] = { ...updated[index], [field]: value } as AdditionalCharge;
    setAdditionalCharges(updated);
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
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={item.unitPrice ?? ''}
                    onChange={(e) => updateLine(index, 'unitPrice', e.target.value === '' ? null : parseFloat(e.target.value))}
                    disabled={!item.serviceId}
                    placeholder="السعر"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] disabled:bg-gray-100 disabled:cursor-not-allowed"
                    title="سعر هذه الفاتورة فقط - لن يغيّر السعر الافتراضي للخدمة"
                  />
                  <div className="w-24 pt-2 text-gray-700 text-sm">
                    {service && item.unitPrice !== null ? (item.unitPrice * item.quantity).toFixed(3) : '0.000'} د.ك
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

          {/* Additional Charges Section */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h3 className="text-lg font-bold text-[#111844] mb-4">رسوم إضافية</h3>
            {additionalCharges.map((charge, index) => (
              <div key={index} className="flex gap-3 items-start mb-3 bg-gray-50 p-3 rounded">
                <select
                  value={charge.chargeType}
                  onChange={(e) => updateCharge(index, 'chargeType', e.target.value as 'PERCENTAGE' | 'FIXED')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                >
                  <option value="FIXED">مبلغ ثابت</option>
                  <option value="PERCENTAGE">نسبة مئوية</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={charge.chargeValue}
                  onChange={(e) => updateCharge(index, 'chargeValue', parseFloat(e.target.value) || 0)}
                  placeholder={charge.chargeType === 'PERCENTAGE' ? 'النسبة' : 'المبلغ'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                />
                <input
                  type="text"
                  value={charge.description}
                  onChange={(e) => updateCharge(index, 'description', e.target.value)}
                  placeholder="الوصف"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                />
                <div className="w-24 pt-2 text-gray-700 text-sm">
                  {charge.chargeType === 'PERCENTAGE' 
                    ? `${((subtotal * charge.chargeValue) / 100).toFixed(3)} د.ك`
                    : `${charge.chargeValue.toFixed(3)} د.ك`
                  }
                </div>
                {additionalCharges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCharge(index)}
                    className="text-[#C4362B] hover:text-[#a32b22] px-2"
                  >
                    حذف
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCharge}
              className="text-[#4B5694] hover:text-[#111844] text-sm"
            >
              + إضافة رسوم إضافية
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">المجموع الفرعي</span>
              <span className="text-gray-900">{subtotal.toFixed(3)} د.ك</span>
            </div>
            {additionalCharges.map((charge, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {charge.description || (charge.chargeType === 'PERCENTAGE' ? 'رسوم نسبة' : 'رسوم ثابتة')}
                  ({charge.chargeType === 'PERCENTAGE' ? `${charge.chargeValue}%` : `${charge.chargeValue.toFixed(3)} د.ك`})
                </span>
                <span className="text-gray-900">
                  {charge.chargeType === 'PERCENTAGE' 
                    ? ((subtotal * charge.chargeValue) / 100).toFixed(3)
                    : charge.chargeValue.toFixed(3)
                  } د.ك
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="text-lg font-bold text-[#111844]">الإجمالي</span>
              <span className="text-lg font-bold text-[#111844]">{total.toFixed(3)} د.ك</span>
            </div>
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
