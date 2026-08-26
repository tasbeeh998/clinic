import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { servicesService, Service } from '../services/services.service';

export default function ServicesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useQuery({
    queryKey: ['services', search, isActiveFilter],
    queryFn: () => servicesService.getServices(search, isActiveFilter, 1, 50),
  });

  const services = data?.data || [];
  const isAdmin = user?.role === 'ADMIN';

  const handleNewService = () => {
    navigate('/services/new');
  };

  const handleEditService = (service: Service) => {
    navigate(`/services/${service.id}/edit`);
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      await servicesService.updateServiceStatus(service.id, { isActive: !service.isActive });
      // Invalidate query to refresh data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update service status:', error);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}>
        {isActive ? 'نشط' : 'غير نشط'}
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
            فشل في تحميل بيانات الخدمات
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#111844]">الخدمات</h1>
          {isAdmin && (
            <button
              onClick={handleNewService}
              className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors"
            >
              + خدمة جديدة
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن خدمة..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={isActiveFilter === undefined ? '' : isActiveFilter.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setIsActiveFilter(value === '' ? undefined : value === 'true');
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
            >
              <option value="">كل الحالات</option>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearch('');
                setIsActiveFilter(undefined);
              }}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {services.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              لا توجد خدمات
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">اسم الخدمة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">السعر</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">آخر تحديث</th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-gray-500">{service.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {parseFloat(service.currentPrice).toFixed(3)} د.ك
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(service.isActive)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(service.updatedAt)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="text-[#4B5694] hover:text-[#111844] text-sm"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleToggleStatus(service)}
                            className={`text-sm ${
                              service.isActive
                                ? 'text-gray-600 hover:text-gray-900'
                                : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {service.isActive ? 'إلغاء تفعيل' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    )}
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
