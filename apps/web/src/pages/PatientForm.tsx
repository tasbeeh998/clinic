import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { patientsService, CreatePatientDto, UpdatePatientDto } from '../services/patients.service';

interface PatientFormProps {
  patientId?: string;
}

export default function PatientForm({ patientId }: PatientFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreatePatientDto | UpdatePatientDto>({
    civilId: '',
    fullNameAr: '',
    fullNameEn: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch patient data if editing
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsService.getPatient(patientId!),
    enabled: !!patientId,
  });

  // Populate form when patient data is loaded
  useEffect(() => {
    if (patient) {
      setFormData({
        civilId: patient.civilId,
        fullNameAr: patient.fullNameAr,
        fullNameEn: patient.fullNameEn || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        address: patient.address || '',
      });
    }
  }, [patient]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePatientDto) => patientsService.createPatient(data),
    onSuccess: (data) => {
      navigate(`/patients/${data.id}`);
    },
    onError: (error: Error) => {
      setErrors({ general: error.message || 'فشل في إنشاء المريض' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientDto }) =>
      patientsService.updatePatient(id, data),
    onSuccess: (data) => {
      navigate(`/patients/${data.id}`);
    },
    onError: (error: Error) => {
      setErrors({ general: error.message || 'فشل في تحديث بيانات المريض' });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.civilId || !formData.civilId.trim()) {
      newErrors.civilId = 'الرقم المدني مطلوب';
    } else if (formData.civilId.length > 12) {
      newErrors.civilId = 'الرقم المدني يجب أن لا يتجاوز 12 حرف';
    }

    if (!formData.fullNameAr || !formData.fullNameAr.trim()) {
      newErrors.fullNameAr = 'الاسم بالعربية مطلوب';
    } else if (formData.fullNameAr.length > 255) {
      newErrors.fullNameAr = 'الاسم يجب أن لا يتجاوز 255 حرف';
    }

    if (formData.fullNameEn && formData.fullNameEn.length > 255) {
      newErrors.fullNameEn = 'الاسم يجب أن لا يتجاوز 255 حرف';
    }

    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = 'رقم الهاتف يجب أن لا يتجاوز 20 حرف';
    }

    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'العنوان يجب أن لا يتجاوز 500 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (patientId) {
      updateMutation.mutate({ id: patientId, data: formData as UpdatePatientDto });
    } else {
      createMutation.mutate(formData as CreatePatientDto);
    }
  };

  const handleChange = (field: keyof CreatePatientDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (isLoadingPatient) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
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
            {patientId ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
          </h1>
          <button
            onClick={() => navigate('/patients')}
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
            {/* Civil ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الرقم المدني <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.civilId}
                onChange={(e) => handleChange('civilId', e.target.value)}
                maxLength={12}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.civilId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل الرقم المدني"
              />
              {errors.civilId && (
                <p className="mt-1 text-sm text-red-600">{errors.civilId}</p>
              )}
            </div>

            {/* Full Name (Arabic) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم بالعربية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullNameAr}
                onChange={(e) => handleChange('fullNameAr', e.target.value)}
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.fullNameAr ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل الاسم بالعربية"
              />
              {errors.fullNameAr && (
                <p className="mt-1 text-sm text-red-600">{errors.fullNameAr}</p>
              )}
            </div>

            {/* Full Name (English) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم بالإنجليزية
              </label>
              <input
                type="text"
                value={formData.fullNameEn}
                onChange={(e) => handleChange('fullNameEn', e.target.value)}
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.fullNameEn ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter name in English"
              />
              {errors.fullNameEn && (
                <p className="mt-1 text-sm text-red-600">{errors.fullNameEn}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                maxLength={20}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل رقم الهاتف"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                maxLength={500}
                rows={3}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أدخل العنوان"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/patients')}
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
                  : patientId
                  ? 'حفظ التغييرات'
                  : 'إضافة المريض'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
