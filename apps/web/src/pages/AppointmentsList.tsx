import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar } from 'lucide-react';
import { appointmentsService, Appointment } from '../services/appointments.service';
import { useTranslation } from 'react-i18next';
import { formatTime as formatTimeUtil } from '../utils/dateFormat';
import { getStatusConfig } from '../utils/formatters';

export default function AppointmentsList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('');

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', formatDate(selectedDate), statusFilter],
    queryFn: () => appointmentsService.getAppointments(formatDate(selectedDate), statusFilter),
  });

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status, t);
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

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const formatTime = (dateString: string) => formatTimeUtil(dateString, i18n.language);

  const formatDateDisplay = (date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-KW' : 'en-GB';
    return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="ui-card p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="ui-skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="ui-card p-6 text-center text-[#C4362B] text-sm">{t('appointments.loadError')}</div>
      </div>
    );
  }

  const appointments = data?.data || [];
  const meta = data?.meta;

  const sortedAppointments = appointments.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-[#102F63]">{t('sidebar.appointments')}</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {t('appointments.subtitle')}
            {meta && meta.total > 0 && (
              <span className="font-medium text-[#102F63]"> · {meta.total} {t('common.appointments')}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleNewAppointment}
          className="btn-primary flex items-center gap-2 px-4 sm:w-auto w-full justify-center"
        >
          <Plus size={18} strokeWidth={2} />
          {t('appointments.newAppointment')}
        </button>
      </div>

      {/* Controls */}
      <div className="ui-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => handleDateChange(-1)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded hover:bg-[#F6F8FC] text-sm whitespace-nowrap"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1.5 border rounded text-sm whitespace-nowrap ${
                isToday(selectedDate)
                  ? 'bg-[#102F63] text-white border-[#102F63]'
                  : 'border-[#E2E8F0] hover:bg-[#F6F8FC]'
              }`}
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => handleDateChange(1)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded hover:bg-[#F6F8FC] text-sm whitespace-nowrap"
            >
              {t('common.next')}
            </button>
            <span className="font-medium text-[#102F63] min-w-[200px] text-center text-sm">
              {formatDateDisplay(selectedDate)}
            </span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ui-input w-full sm:w-auto"
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value="BOOKED">{t('appointments.statusBooked')}</option>
            <option value="CONFIRMED">{t('appointments.statusConfirmed')}</option>
            <option value="DONE">{t('appointments.statusDone')}</option>
            <option value="CANCELLED">{t('appointments.statusCancelled')}</option>
            <option value="NO_SHOW">{t('appointments.statusNoShow')}</option>
          </select>
        </div>
      </div>

      {/* Agenda View */}
      <div className="ui-card overflow-hidden p-0">
        {sortedAppointments.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <Calendar size={48} strokeWidth={1.5} className="mx-auto mb-3 text-[#94A3B8]" />
            <p className="text-sm">{t('appointments.noAppointmentsToday')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('visits.time')}</th>
                    <th>{t('visits.patient')}</th>
                    <th>{t('patients.civilId')}</th>
                    <th>{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className="hover:bg-[#F6F8FC] cursor-pointer"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleAppointmentClick(apt);
                        }
                      }}
                    >
                      <td className="text-[#1F2430] font-medium">{formatTime(apt.scheduledAt)}</td>
                      <td className="font-medium text-[#1F2430]">{apt.patient.fullNameAr}</td>
                      <td className="text-[#64748B]">{apt.patient.civilId}</td>
                      <td>{getStatusBadge(apt.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-4">
              {sortedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => handleAppointmentClick(apt)}
                  className="bg-[#F6F8FC] rounded-lg p-4 cursor-pointer hover:bg-[#E2E8F0] transition-colors"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAppointmentClick(apt);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-[#102F63] font-bold text-lg">{formatTime(apt.scheduledAt)}</div>
                      <div>
                        <div className="font-medium text-[#1F2430]">{apt.patient.fullNameAr}</div>
                        <div className="text-sm text-[#94A3B8]">{apt.patient.civilId}</div>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
