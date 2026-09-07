import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  ClipboardList,
  Stethoscope,
  ReceiptText,
  BarChart3,
  Settings,
  X,
  Languages,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { setLanguage } from '../i18n/config';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: 'sidebar.operations',
    items: [
      { labelKey: 'sidebar.dashboard', path: '/dashboard', icon: LayoutDashboard },
      { labelKey: 'sidebar.patients', path: '/patients', icon: UsersRound },
      { labelKey: 'sidebar.appointments', path: '/appointments', icon: CalendarDays },
      { labelKey: 'sidebar.visits', path: '/visits', icon: ClipboardList },
    ],
  },
  {
    labelKey: 'sidebar.billing',
    items: [
      { labelKey: 'sidebar.invoices', path: '/invoices', icon: ReceiptText },
      { labelKey: 'sidebar.reports', path: '/reports', icon: BarChart3, adminOnly: true },
    ],
  },
  {
    labelKey: 'sidebar.administration',
    items: [
      { labelKey: 'sidebar.services', path: '/services', icon: Stethoscope, adminOnly: true },
      { labelKey: 'sidebar.settings', path: '/settings', icon: Settings, adminOnly: true },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    operations: true,
    billing: true,
    administration: true,
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const content = (
    <div className="h-full flex flex-col bg-[#102F63] text-white w-[260px]">
      <div className="flex items-center justify-between px-5 pt-6 pb-2 md:hidden">
        <span className="text-sm font-medium text-white/80">{t('sidebar.menu')}</span>
        <button onClick={onClose} aria-label={t('common.close')} className="text-white/70 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Clinic name is intentionally not translated — it's the brand name,
          same in both languages, exactly like a company name would be. */}
      <div className="flex flex-col items-center text-center px-5 pt-6 pb-6 border-b border-white/10">
        <img src="/assets/logo.png" alt="Specialized Clinics Center" className="w-14 h-14 rounded-full mb-3" />
        <div className="text-[14px] font-semibold leading-snug">مركز العيادات التخصصية</div>
        <div className="text-[11px] text-white/60 mt-0.5">Specialized Clinics Center</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const groupItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (groupItems.length === 0) return null;

          const isRTL = i18n.language === 'ar';
          const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

          return (
            <div key={group.labelKey}>
              <button
                onClick={() => toggleGroup(group.labelKey)}
                className="w-full flex items-center gap-2 px-3 py-2 text-white/60 text-xs font-medium uppercase tracking-wider hover:text-white/80 transition-colors"
              >
                {t(group.labelKey)}
                <ChevronIcon
                  size={14}
                  className={`transition-transform ${expandedGroups[group.labelKey] ? 'rotate-90' : ''}`}
                />
              </button>
              {expandedGroups[group.labelKey] && (
                <div className="mt-1 space-y-1">
                  {groupItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-colors ${
                          active
                            ? 'bg-white/12 text-white font-semibold'
                            : 'text-white/70 hover:bg-white/8 hover:text-white'
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.75} />
                        <span>{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <div className="flex items-center gap-2 px-2 mb-2 text-white/50 text-xs">
          <Languages size={14} strokeWidth={1.75} />
          {t('sidebar.language')}
        </div>
        <div className="flex bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              i18n.language === 'en' ? 'bg-white text-[#102F63]' : 'text-white/70 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              i18n.language === 'ar' ? 'bg-white text-[#102F63]' : 'text-white/70 hover:text-white'
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block shrink-0">{content}</aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute top-0 h-full ltr:left-0 rtl:right-0">{content}</div>
        </div>
      )}
    </>
  );
}
