import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsService, CreateAppointmentDto } from '../services/appointments.service';
import { patientsService } from '../services/patients.service';

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateAppointmentDto>({
    patientId: '',
    scheduledAt: '',
    notes: '',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Search patients for typeahead
  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => patientsService.getPatients(patientSearch, false, 1, 10),
    enabled: patientSearch.length >= 2,
  });

  const patients = patientsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentDto) => appointmentsService.createAppointment(data),
    onSuccess: (data) => {
      navigate(`/appointments/${data.id}`);
    },
    onError: (error: Error) => {
      setErrors({ general: error.message || 'فشل في إنشاء الموعد' });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = 'المريض مطلوب';
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'تاريخ ووقت الموعد مطلوب';
    } else {
      const scheduledDate = new Date(formData.scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        newErrors.scheduledAt = 'تاريخ ووقت غير صالح';
      }
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'الملاحظات يجب أن لا تتجاوز 1000 حرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createMutation.mutate(formData);
  };

  const handlePatientSelect = (patientId: string, patientName: string) => {
    setFormData((prev) => ({ ...prev, patientId }));
    setPatientSearch(patientName);
    setShowPatientDropdown(false);
  };

  const handleCancel = () => {
    navigate('/appointments');
  };

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#111844]">موعد جديد</h1>
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
            {/* Patient Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المريض <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="ابحث بالاسم أو الرقم المدني أو الهاتف..."
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.patientId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.patientId && (
                <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
              )}

              {/* Patient Dropdown */}
              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientSelect(patient.id, patient.fullNameAr)}
                      className="w-full px-4 py-3 text-right hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{patient.fullNameAr}</div>
                      <div className="text-sm text-gray-500">
                        {patient.civilId} {patient.phone && `• ${patient.phone}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التاريخ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.scheduledAt ? formData.scheduledAt.split('T')[0] : ''}
                  onChange={(e) => {
                    const time = formData.scheduledAt ? formData.scheduledAt.split('T')[1] || '10:00' : '10:00';
                    setFormData((prev) => ({ ...prev, scheduledAt: `${e.target.value}T${time}` }));
                  }}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                    errors.scheduledAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوقت <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.scheduledAt ? formData.scheduledAt.split('T')[1] || '10:00' : '10:00'}
                  onChange={(e) => {
                    const date = formData.scheduledAt ? formData.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0];
                    setFormData((prev) => ({ ...prev, scheduledAt: `${date}T${e.target.value}` }));
                  }}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                    errors.scheduledAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            {errors.scheduledAt && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduledAt}</p>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                maxLength={1000}
                rows={3}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844] ${
                  errors.notes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="أضف ملاحظات اختيارية..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
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
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'جاري الحجز...' : 'حجز الموعد'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
