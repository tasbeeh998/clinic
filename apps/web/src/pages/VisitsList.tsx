import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { visitsService, Visit } from '../services/visits.service';
import { patientsService } from '../services/patients.service';

export default function VisitsList() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => patientsService.getPatients(patientSearch, false, 1, 10),
    enabled: patientSearch.length >= 2,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['visits', selectedPatientId, typeFilter, fromDate, toDate],
    queryFn: () => visitsService.getVisits(
      selectedPatientId,
      undefined,
      typeFilter,
      fromDate,
      toDate,
      1,
      50
    ),
  });

  const getVisitTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
      CHECKUP: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'كشف' },
      FOLLOW_UP: { bg: 'bg-green-100', text: 'text-green-700', label: 'متابعة' },
      OTHER: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'أخرى' },
    };

    const config = typeConfig[type] || typeConfig.OTHER;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleNewVisit = () => {
    navigate('/visits/new');
  };

  const handleVisitClick = (visit: Visit) => {
    navigate(`/patients/${visit.patientId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setTypeFilter('');
    setPatientSearch('');
    setSelectedPatientId('');
    setFromDate('');
    setToDate('');
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
            فشل في تحميل بيانations الزيارات
          </div>
        </div>
      </div>
    );
  }

  const visits = data?.data || [];

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#111844]">الزيارات</h1>
          <button
            onClick={handleNewVisit}
            className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors"
          >
            + زيارة جديدة
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Patient Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="ابحث عن مريض..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
              />
              {patientsData && patientsData.data.length > 0 && patientSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {patientsData.data.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setPatientSearch(patient.fullNameAr);
                      }}
                      className="w-full px-4 py-3 text-right hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{patient.fullNameAr}</div>
                      <div className="text-sm text-gray-500">{patient.civilId}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
            >
              <option value="">كل الأنواع</option>
              <option value="CHECKUP">كشف</option>
              <option value="FOLLOW_UP">متابعة</option>
              <option value="OTHER">أخرى</option>
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111844]"
            />

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>

        {/* Visits Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {visits.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              لا توجد زيارات
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">المريض</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الرقم المدني</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">نوع الزيارة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الزيارة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الموعد</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">أنشأ بواسطة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visits.map((visit) => (
                  <tr
                    key={visit.id}
                    onClick={() => handleVisitClick(visit)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{visit.patient.fullNameAr}</td>
                    <td className="px-6 py-4 text-gray-600">{visit.patient.civilId}</td>
                    <td className="px-6 py-4">{getVisitTypeBadge(visit.type)}</td>
                    <td className="px-6 py-4 text-gray-900">{formatDate(visit.visitDate)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {visit.appointment ? formatDate(visit.appointment.scheduledAt) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{visit.createdBy?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices/new?visitId=${visit.id}`);
                        }}
                        className="text-[#4B5694] hover:text-[#111844] text-sm"
                      >
                        فاتورة
                      </button>
                    </td>
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
