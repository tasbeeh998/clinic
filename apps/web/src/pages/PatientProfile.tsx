import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsService } from '../services/patients.service';
import { visitsService } from '../services/visits.service';

type TabType = 'overview' | 'visits' | 'invoices' | 'payments' | 'appointments';

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsService.getPatient(id!),
    enabled: !!id,
  });

  const { data: visitsData } = useQuery({
    queryKey: ['patientVisits', id],
    queryFn: () => visitsService.getPatientVisits(id!),
    enabled: !!id && activeTab === 'visits',
  });

  const visits = visitsData?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="col-span-2 h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            فشل في تحميل بيانات المريض
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'نظرة عامة' },
    { id: 'visits' as TabType, label: 'الزيارات' },
    { id: 'invoices' as TabType, label: 'الفواتير' },
    { id: 'payments' as TabType, label: 'المدفوعات' },
    { id: 'appointments' as TabType, label: 'المواعيد' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <button onClick={() => navigate('/patients')} className="hover:text-[#111844]">
            المرضى
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{patient.fullNameAr}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Panel (Right side in RTL) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              {/* Unpaid Balance Warning */}
              <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded text-sm">
                رصيد مستحق: 0 د.ك
              </div>

              {/* Patient Name */}
              <h2 className="text-2xl font-bold text-[#111844] mb-4">{patient.fullNameAr}</h2>

              {/* Civil ID - Most Dominant */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-1">الرقم المدني</label>
                <p className="text-xl font-bold text-[#111844]">{patient.civilId}</p>
              </div>

              {/* Phone */}
              {patient.phone && (
                <div className="mb-4">
                  <label className="text-sm text-gray-500 block mb-1">الهاتف</label>
                  <p className="text-gray-900">{patient.phone}</p>
                </div>
              )}

              {/* Date of Birth */}
              {patient.dateOfBirth && (
                <div className="mb-4">
                  <label className="text-sm text-gray-500 block mb-1">تاريخ الميلاد</label>
                  <p className="text-gray-900">
                    {new Date(patient.dateOfBirth).toLocaleDateString('ar-KW')}
                  </p>
                </div>
              )}

              {/* Address */}
              {patient.address && (
                <div className="mb-4">
                  <label className="text-sm text-gray-500 block mb-1">العنوان</label>
                  <p className="text-gray-900">{patient.address}</p>
                </div>
              )}

              {/* English Name */}
              {patient.fullNameEn && (
                <div className="mb-6">
                  <label className="text-sm text-gray-500 block mb-1">الاسم (إنجليزي)</label>
                  <p className="text-gray-900">{patient.fullNameEn}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* + New Visit - Primary Action */}
                <button
                  onClick={() => navigate(`/visits/new?patientId=${patient.id}`)}
                  className="w-full py-3 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors font-medium"
                >
                  + زيارة جديدة
                </button>

                {/* Edit Patient */}
                <button
                  onClick={() => navigate(`/patients/${patient.id}/edit`)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  تعديل البيانات
                </button>
              </div>

              {/* Archive Status */}
              {patient.isArchived && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded text-sm">
                  هذا المريض مؤرشف
                </div>
              )}
            </div>
          </div>

          {/* Tabbed Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-0 space-x-reverse">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-[#111844] border-b-2 border-[#111844]'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">نظرة عامة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-500">آخر زيارة</p>
                        <p className="text-lg font-semibold text-gray-900">-</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-500">الرصيد المستحق</p>
                        <p className="text-lg font-semibold text-gray-900">0 د.ك</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-500">الموعد القادم</p>
                        <p className="text-lg font-semibold text-gray-900">-</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-500">إجمالي الزيارات</p>
                        <p className="text-lg font-semibold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'visits' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">سجل الزيارات</h3>
                      <button
                        onClick={() => navigate(`/visits/new?patientId=${id}`)}
                        className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors text-sm"
                      >
                        + زيارة جديدة
                      </button>
                    </div>
                    {visits.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد زيارات مسجلة
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">النوع</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">الموعد</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">الملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {visits.map((visit) => (
                            <tr key={visit.id}>
                              <td className="px-4 py-3 text-gray-900">
                                {new Date(visit.visitDate).toLocaleDateString('ar-KW', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  visit.type === 'CHECKUP' ? 'bg-blue-100 text-blue-700' :
                                  visit.type === 'FOLLOW_UP' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {visit.type === 'CHECKUP' ? 'كشف' :
                                   visit.type === 'FOLLOW_UP' ? 'متابعة' : 'أخرى'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {visit.appointment ? new Date(visit.appointment.scheduledAt).toLocaleDateString('ar-KW') : '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-sm">
                                {visit.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'invoices' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">سجل الفواتير</h3>
                    <div className="text-center py-8 text-gray-500">
                      لا توجد فواتير مسجلة
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">سجل المدفوعات</h3>
                    <div className="text-center py-8 text-gray-500">
                      لا توجد مدفوعات مسجلة
                    </div>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">سجل المواعيد</h3>
                    <div className="text-center py-8 text-gray-500">
                      لا توجد مواعيد مسجلة
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
