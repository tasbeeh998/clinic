import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, Bell, UserRound, LogOut, ChevronDown, Languages, CalendarClock, DatabaseBackup, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { setLanguage } from '../i18n/config';
import { notificationsService } from '../services/notifications.service';
import { formatDateTime } from '../utils/dateFormat';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const toggleLanguage = () => {
    setLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = user?.role === 'ADMIN' ? t('roles.admin') : t('roles.receptionist');

  // Polls every 60s — good enough for reminders that only change every 15
  // minutes on the backend side, without needing a websocket.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 60000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getAll(),
    enabled: notifOpen,
  });

  const handleMarkAllRead = async () => {
    await notificationsService.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  };

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await notificationsService.markRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-5 md:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label={t('common.openMenu')}
          className="md:hidden text-[#102F63] p-1.5 -mr-1.5"
        >
          <Menu size={22} />
        </button>
        <div className="hidden md:flex items-center gap-2.5">
          <img src="/assets/logo.png" alt="Specialized Clinics Center" className="w-9 h-9 rounded-full" />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#102F63]">مركز العيادات التخصصية</div>
            <div className="text-[10px] text-[#94A3B8]">Specialized Clinics Center</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[#173B78] border border-[#E2E8F0] hover:bg-[#F6F8FC] rounded-lg px-3 py-1.5 transition-colors"
        >
          <Languages size={16} strokeWidth={1.75} />
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={t('common.notifications')}
            className="relative text-[#64748B] hover:text-[#102F63] p-1.5"
          >
            <Bell size={19} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E62E1B] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-[#E2E8F0] rounded-lg shadow-[var(--shadow-soft-lg)] z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
                <span className="text-[13px] font-semibold text-[#102F63]">{t('common.notifications')}</span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[12px] text-[#173B78] hover:underline">
                    <CheckCheck size={13} strokeWidth={1.75} />
                    {t('common.markAllRead')}
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[#94A3B8]">{t('common.noNotifications')}</div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => handleNotificationClick(n.id, n.isRead)}
                        className={`w-full text-right px-4 py-3 border-b border-[#F1F5F9] last:border-0 flex items-start gap-2.5 hover:bg-[#F6F8FC] transition-colors ${
                          !n.isRead ? 'bg-[#F0F4FB]' : ''
                        }`}
                      >
                        <span className="mt-0.5 text-[#173B78] shrink-0">
                          {n.type === 'BACKUP_DUE' ? <DatabaseBackup size={16} strokeWidth={1.75} /> : <CalendarClock size={16} strokeWidth={1.75} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] font-medium text-[#1F2430]">
                            {n.type === 'BACKUP_DUE' ? t('notifications.backupDue') : t('notifications.appointmentUpcoming', { name: n.message })}
                          </span>
                          <span className="block text-[11px] text-[#94A3B8] mt-0.5">{formatDateTime(n.createdAt, i18n.language)}</span>
                        </span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#173B78] mt-1.5 shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-[#F6F8FC] rounded-lg px-2 py-1.5 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#173B78] text-white flex items-center justify-center">
              <UserRound size={16} strokeWidth={1.75} />
            </span>
            <span className="hidden sm:block text-right leading-tight">
              <span className="block text-[13px] font-semibold text-[#102F63]">{user?.name || t('common.user')}</span>
              <span className="block text-[11px] text-[#94A3B8]">{roleLabel}</span>
            </span>
            <ChevronDown size={14} className="text-[#94A3B8] hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-[var(--shadow-soft-lg)] py-1 z-50">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#C4362B] hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} strokeWidth={1.75} />
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
