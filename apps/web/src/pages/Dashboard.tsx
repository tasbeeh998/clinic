import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersRound, CalendarDays, ClipboardList, ReceiptText, Stethoscope, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleLabel = user?.role === 'ADMIN' ? t('roles.admin') : t('roles.receptionist');

  return (
    <div className="min-h-screen flex bg-[#F6F8FC]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="page-container flex-1">
          <div className="mb-6">
            <h1 className="text-[26px] font-bold text-[#102F63]">{t('dashboard.title')}</h1>
            <p className="text-[14px] text-[#64748B] mt-1">{t('dashboard.subtitle')}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <DashboardCard
              title={t('sidebar.patients')}
              description={t('dashboard.patientsDesc')}
              icon={UsersRound}
              onClick={() => navigate('/patients')}
            />
            <DashboardCard
              title={t('sidebar.appointments')}
              description={t('dashboard.appointmentsDesc')}
              icon={CalendarDays}
              onClick={() => navigate('/appointments')}
            />
            <DashboardCard
              title={t('sidebar.visits')}
              description={t('dashboard.visitsDesc')}
              icon={ClipboardList}
              onClick={() => navigate('/visits')}
            />
            <DashboardCard
              title={t('sidebar.invoices')}
              description={t('dashboard.invoicesDesc')}
              icon={ReceiptText}
              onClick={() => navigate('/invoices')}
              accent="red"
            />
            {isAdmin && (
              <DashboardCard
                title={t('sidebar.services')}
                description={t('dashboard.servicesDesc')}
                icon={Stethoscope}
                onClick={() => navigate('/services')}
              />
            )}
          </div>

          <div className="ui-card px-6 py-5">
            <h2 className="text-[16px] font-semibold text-[#102F63] mb-3">{t('dashboard.quickSummary')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x rtl:divide-x-reverse divide-[#E2E8F0]">
              <StatCard label={t('dashboard.totalPatients')} value={null} icon={UsersRound} />
              <StatCard label={t('dashboard.todayAppointments')} value={null} icon={CalendarDays} />
              <StatCard label={t('dashboard.weekVisits')} value={null} icon={ClipboardList} />
              <StatCard label={t('dashboard.totalOutstanding')} value={null} icon={Wallet} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
