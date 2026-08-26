import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { servicesService, CreateServiceDto, UpdateServiceDto } from '../services/services.service';

export default function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateServiceDto | UpdateServiceDto>({
    name: '',
    code: '',
    description: '',
    currentPrice: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  // Fetch service data if editing
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesService.getService(id!),
    enabled: isEdit,
  });

  // Populate form when service data is loaded
  useEffect(() => {
    if (serviceData) {
      setFormData({
        name: serviceData.name,
        code: serviceData.code || '',
        description: serviceData.description || '',
        currentPrice: parseFloat(serviceData.currentPrice),
        isActive: serviceData.isActive,
      });
    }
  }, [serviceData]);

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceDto) => servicesService.createService(data),
    onSuccess: () => {
      navigate('/services');
    },
    onError: (error: Error) => {
      setErrors({ general: error.message || 'فشل في إنشاء الخدمة' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; dto: UpdateServiceDto }) =>
      servicesService.updateService(data.id, data.dto),
    onSuccess: () => {
      navigate('/services');
    },
    onError: (error: Error) => {
      setErrors({ general: error.message || 'فشل في تحديث الخدمة' });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'اسم الخدمة مطلوب';
    }

    if (formData.name && formData.name.length > 255) {
      newErrors.name = 'اسم الخدمة يجب أن لا يتجاوز 255 حرف';
    }

    if (formData.currentPrice === undefined || formData.currentPrice === null) {
      newErrors.currentPrice = 'السعر مطلوب';
    } else if (formData.currentPrice < 0) {
      newErrors.currentPrice = 'السعر يجب أن يكون أكبر من أو يساوي صفر';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'الوصف يجب أن لا يتجاوز 1000 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEdit) {
      updateMutation.mutate({ id: id!, dto: formData as UpdateServiceDto });
    } else {
      createMutation.mutate(formData as CreateServiceDto);
    }
  };

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value);
    setFormData((prev) => ({ ...prev, currentPrice: isNaN(price) ? 0 : price }));
    
    // Show warning if editing and price is being changed
    if (isEdit && serviceData && price !== parseFloat(serviceData.currentPrice)) {
      setShowPriceWarning(true);
    }
  };

  const handleCancel = () => {
    navigate('/services');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-[#111844]">
            {isEdit ? 'تعديل الخدمة' : 'خدمة جديدة'}
          </h1>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            إلغاء
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          {errors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الخدمة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="مثال: كشف عام"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كود الخدمة
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
                placeholder="مثال: OBA0001 (يظهر في فاتورة PDF - اختياري)"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={1000}
                rows={3}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="وصف الخدمة (اختياري)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السعر <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.currentPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                    errors.currentPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.000"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  د.ك
                </span>
              </div>
              {errors.currentPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPrice}</p>
              )}
              {showPriceWarning && (
                <p className="mt-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
                  ⚠️ تغيير سعر الخدمة سيؤثر على الفواتير الجديدة فقط، ولن يغير الفواتير السابقة.
                </p>
              )}
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-[#111844] border-gray-300 rounded focus:ring-[#111844]"
                />
                <span className="text-sm font-medium text-gray-700">نشط</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                الخدمات غير النشطة لن تكون متاحة للفواتير الجديدة
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'جاري الحفظ...'
                  : isEdit
                  ? 'حفظ التغييرات'
                  : 'حفظ الخدمة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
