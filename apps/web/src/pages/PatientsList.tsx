import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsService, Patient } from '../services/patients.service';

export default function PatientsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isArchived, setIsArchived] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', search, isArchived, page],
    queryFn: () => patientsService.getPatients(search, isArchived, page, limit),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const handleArchiveFilter = (value: string) => {
    if (value === 'all') {
      setIsArchived(undefined);
    } else {
      setIsArchived(value === 'archived');
    }
    setPage(1);
  };

  const handleArchive = async (patient: Patient) => {
    try {
      if (patient.isArchived) {
        await patientsService.restorePatient(patient.id);
      } else {
        await patientsService.archivePatient(patient.id);
      }
      // Refetch will happen automatically via query invalidation
      window.location.reload();
    } catch (error) {
      console.error('Failed to toggle archive status:', error);
    }
  };

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
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
            فشل في تحميل بيانات المرضى
          </div>
        </div>
      </div>
    );
  }

  const patients = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#111844]">المرضى</h1>
          <button
            onClick={handleAddPatient}
            className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors"
          >
            + مريضة جديدة
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="بحث بالرقم المدني أو الاسم أو الهاتف..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleArchiveFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                isArchived === undefined
                  ? 'bg-[#111844] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => handleArchiveFilter('active')}
              className={`px-3 py-1 rounded-md transition-colors ${
                isArchived === false
                  ? 'bg-[#111844] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              نشط
            </button>
            <button
              onClick={() => handleArchiveFilter('archived')}
              className={`px-3 py-1 rounded-md transition-colors ${
                isArchived === true
                  ? 'bg-[#111844] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              مؤرشف
            </button>
          </div>
        </div>

        {/* Empty State */}
        {patients.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">
              {search ? 'لا توجد نتائج للبحث' : 'لا يوجد مرضى بعد'}
            </p>
            {!search && (
              <button
                onClick={handleAddPatient}
                className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors"
              >
                أضف مريضتك الأولى
              </button>
            )}
          </div>
        )}

        {/* Patients Table */}
        {patients.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الرقم المدني</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الهاتف</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">آخر زيارة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <td className="px-6 py-4 font-bold text-[#111844]">{patient.civilId}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{patient.fullNameAr}</div>
                      {patient.fullNameEn && (
                        <div className="text-sm text-gray-500">{patient.fullNameEn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{patient.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">-</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(patient);
                        }}
                        className={`text-sm px-3 py-1 rounded ${
                          patient.isArchived
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {patient.isArchived ? 'استعادة' : 'أرشفة'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  صفحة {meta.page} من {meta.totalPages} ({meta.total} إجمالي)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
