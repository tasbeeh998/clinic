import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UsersRound, CalendarDays, ClipboardList, ReceiptText, Wallet, Calendar, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { patientsService } from '../services/patients.service';
import { appointmentsService } from '../services/appointments.service';
import { visitsService } from '../services/visits.service';
import { reportsService } from '../services/reports.service';
import { formatTime } from '../utils/dateFormat';
import { getStatusConfig } from '../utils/formatters';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel = user?.role === 'ADMIN' ? t('roles.admin') : t('roles.receptionist');

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = formatDateLocal(new Date());

  const { data: patientsData, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ['patients', 'count'],
    queryFn: () => patientsService.getPatients(undefined, undefined, 1, 1),
    select: (data) => data.meta.total,
  });

  const { data: appointmentsData, isLoading: appointmentsLoading, error: appointmentsError } = useQuery({
    queryKey: ['appointments', 'today', today],
    queryFn: () => appointmentsService.getAppointments(today, undefined, undefined, 1, 1),
    select: (data) => data.meta.total,
  });

  const { data: todayVisitsData, isLoading: todayVisitsLoading, error: todayVisitsError } = useQuery({
    queryKey: ['visits', 'today', today],
    queryFn: () => visitsService.getVisits(undefined, undefined, undefined, undefined, today, today, undefined, 1, 1),
    select: (data) => data.meta.total,
  });

  const { data: todayAppointmentsList, isLoading: todayAppointmentsListLoading } = useQuery({
    queryKey: ['appointments', 'today-list', today],
    queryFn: () => appointmentsService.getAppointments(today, undefined, undefined, 1, 10),
  });

  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => reportsService.getSummary(),
    enabled: isAdmin,
    select: (data) => data.outstandingAmount,
  });

  const formatDateDisplay = (date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-KW' : 'en-GB';
    return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const todayAppointments = todayAppointmentsList?.data || [];
  const sortedAppointments = todayAppointments.sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <div className="min-h-screen flex bg-[#F6F8FC]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="page-container flex-1">
          <div className="mb-6">
            <h1 className="text-[26px] font-bold text-[#102F63]">{t('dashboard.title')}</h1>
            <p className="text-[14px] text-[#64748B] mt-1">
              {t('dashboard.subtitle')} · {formatDateDisplay(new Date())} · {roleLabel}
            </p>
          </div>

          <div className="ui-card px-6 py-5 mb-6 flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-[#173B78] text-white flex items-center justify-center shrink-0">
              <UsersRound size={20} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[#102F63]">{t('dashboard.welcome', { name: user?.name || 'Admin' })}</p>
              <p className="text-[13px] text-[#64748B]">{t('dashboard.role')}: {roleLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label={t('dashboard.todayAppointments')}
              value={appointmentsData}
              isLoading={appointmentsLoading}
              error={!!appointmentsError}
              icon={CalendarDays}
            />
            <StatCard
              label={t('dashboard.todayVisits')}
              value={todayVisitsData}
              isLoading={todayVisitsLoading}
              error={!!todayVisitsError}
              icon={ClipboardList}
            />
            <StatCard
              label={t('dashboard.totalPatients')}
              value={patientsData}
              isLoading={patientsLoading}
              error={!!patientsError}
              icon={UsersRound}
            />
            {isAdmin && (
              <StatCard
                label={t('dashboard.totalOutstanding')}
                value={reportsData}
                isLoading={reportsLoading}
                error={!!reportsError}
                icon={Wallet}
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="ui-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold text-[#102F63] flex items-center gap-2">
                    <Calendar size={18} strokeWidth={1.75} />
                    {t('dashboard.todayAgenda')}
                  </h2>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="text-sm text-[#173B78] hover:underline"
                  >
                    {t('common.viewAll')}
                  </button>
                </div>
                {todayAppointmentsListLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="ui-skeleton h-14 rounded-lg" />
                    ))}
                  </div>
                ) : sortedAppointments.length === 0 ? (
                  <div className="text-center py-8 text-[#64748B] text-sm">
                    {t('appointments.noAppointmentsToday')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedAppointments.slice(0, 5).map((apt) => {
                      const statusConfig = getStatusConfig(apt.status, t);
                      return (
                        <div
                          key={apt.id}
                          onClick={() => navigate(`/appointments/${apt.id}`)}
                          className="flex items-center justify-between p-3 bg-[#F6F8FC] rounded-lg cursor-pointer hover:bg-[#E2E8F0] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-[#102F63] font-medium text-sm w-16">
                              {formatTime(apt.scheduledAt, i18n.language)}
                            </div>
                            <div>
                              <div className="font-medium text-[#1F2430] text-sm">{apt.patient.fullNameAr}</div>
                              <div className="text-xs text-[#94A3B8]">{apt.patient.civilId}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="ui-card p-5">
                <h2 className="text-[16px] font-semibold text-[#102F63] mb-4 flex items-center gap-2">
                  <Activity size={18} strokeWidth={1.75} />
                  {t('dashboard.quickActions')}
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/patients/new')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F6F8FC] transition-colors text-start"
                  >
                    <UsersRound size={18} strokeWidth={1.75} className="text-[#173B78]" />
                    <span className="text-sm text-[#1F2430]">{t('patients.addNew')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/appointments/new')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F6F8FC] transition-colors text-start"
                  >
                    <CalendarDays size={18} strokeWidth={1.75} className="text-[#173B78]" />
                    <span className="text-sm text-[#1F2430]">{t('appointments.newAppointment')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/visits/new')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F6F8FC] transition-colors text-start"
                  >
                    <ClipboardList size={18} strokeWidth={1.75} className="text-[#173B78]" />
                    <span className="text-sm text-[#1F2430]">{t('visits.registerNew')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/invoices/new')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F6F8FC] transition-colors text-start"
                  >
                    <ReceiptText size={18} strokeWidth={1.75} className="text-[#173B78]" />
                    <span className="text-sm text-[#1F2430]">{t('invoices.newInvoice')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
