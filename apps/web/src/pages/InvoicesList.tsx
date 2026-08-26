import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesService, Invoice } from '../services/invoices.service';

export default function InvoicesList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoicesService.getInvoices(undefined, statusFilter || undefined, 1, 50),
  });

  const invoices = data?.data || [];

  const getStatusBadge = (status: Invoice['status']) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'مسودة' },
      ISSUED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'صادرة' },
      VOID: { bg: 'bg-red-100', text: 'text-red-700', label: 'ملغاة' },
    };
    const c = config[status] || config.DRAFT;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const getPaymentBadge = (status: Invoice['paymentStatus']) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      UNPAID: { bg: 'bg-red-100', text: 'text-red-700', label: 'غير مدفوعة' },
      PARTIALLY_PAID: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'مدفوعة جزئياً' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'مدفوعة بالكامل' },
    };
    const c = config[status] || config.UNPAID;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            فشل في تحميل بيانات الفواتير
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#111844]">الفواتير</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
            >
              <option value="">كل الحالات</option>
              <option value="DRAFT">مسودة</option>
              <option value="ISSUED">صادرة</option>
              <option value="VOID">ملغاة</option>
            </select>
            <button
              onClick={() => setStatusFilter('')}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-gray-500">لا توجد فواتير</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">المريض</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجمالي</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">المتبقي</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">حالة الفاتورة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">حالة الدفع</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-gray-900">{invoice.patient?.fullNameAr}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {parseFloat(invoice.total).toFixed(3)} د.ك
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {parseFloat(invoice.remaining).toFixed(3)} د.ك
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4">{getPaymentBadge(invoice.paymentStatus)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(invoice.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
