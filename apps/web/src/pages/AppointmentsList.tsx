import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { appointmentsService, Appointment } from '../services/appointments.service';

type ViewType = 'calendar' | 'list';

export default function AppointmentsList() {
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('');

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', formatDate(selectedDate), statusFilter],
    queryFn: () => appointmentsService.getAppointments(formatDate(selectedDate), statusFilter),
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      BOOKED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'محجوز' },
      CONFIRMED: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'مؤكد' },
      DONE: { bg: 'bg-green-100', text: 'text-green-700', label: 'تم' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'ملغي' },
      NO_SHOW: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'لم يحضر' },
    };

    const config = statusConfig[status] || statusConfig.BOOKED;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleNewAppointment = () => {
    navigate('/appointments/new');
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('ar-KW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
            فشل في تحميل بيانات المواعيد
          </div>
        </div>
      </div>
    );
  }

  const appointments = data?.data || [];

  // Generate time slots for calendar view
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="min-h-screen bg-[#F6F7FA] dir-rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#111844]">المواعيد</h1>
          <button
            onClick={handleNewAppointment}
            className="px-4 py-2 bg-[#111844] text-white rounded-md hover:bg-[#1a237e] transition-colors"
          >
            + موعد جديد
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDateChange(-1)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                السابق
              </button>
              <span className="font-medium text-gray-900 min-w-[200px] text-center">
                {formatDateDisplay(selectedDate)}
              </span>
              <button
                onClick={() => handleDateChange(1)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                التالي
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('calendar')}
                className={`px-3 py-1 rounded ${
                  viewType === 'calendar'
                    ? 'bg-[#111844] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                تقويم
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`px-3 py-1 rounded ${
                  viewType === 'list'
                    ? 'bg-[#111844] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                قائمة
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded"
            >
              <option value="">كل الحالات</option>
              <option value="BOOKED">محجوز</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="DONE">تم</option>
              <option value="CANCELLED">ملغي</option>
              <option value="NO_SHOW">لم يحضر</option>
            </select>
          </div>
        </div>

        {/* Calendar View */}
        {viewType === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {timeSlots.map((time) => {
                const slotAppointments = appointments.filter((apt) => {
                  const aptTime = formatTime(apt.scheduledAt);
                  return aptTime === time;
                });

                return (
                  <div
                    key={time}
                    className="flex items-center p-4 hover:bg-gray-50 min-h-[60px]"
                  >
                    <div className="w-20 text-sm font-medium text-gray-600">{time}</div>
                    <div className="flex-1">
                      {slotAppointments.length > 0 ? (
                        slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => handleAppointmentClick(apt)}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 mb-2"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{apt.patient.fullNameAr}</div>
                              <div className="text-sm text-gray-500">{apt.patient.civilId}</div>
                            </div>
                            {getStatusBadge(apt.status)}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">— متاح —</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewType === 'list' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                لا توجد مواعيد في هذا اليوم
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الوقت</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">المريض</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الرقم المدني</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .map((apt) => (
                      <tr
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 text-gray-900">{formatTime(apt.scheduledAt)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{apt.patient.fullNameAr}</td>
                        <td className="px-6 py-4 text-gray-600">{apt.patient.civilId}</td>
                        <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
