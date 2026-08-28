import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  ClipboardList,
  Stethoscope,
  ReceiptText,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
  { label: 'المرضى', path: '/patients', icon: UsersRound },
  { label: 'المواعيد', path: '/appointments', icon: CalendarDays },
  { label: 'الزيارات', path: '/visits', icon: ClipboardList },
  { label: 'الخدمات', path: '/services', icon: Stethoscope, adminOnly: true },
  { label: 'الفواتير', path: '/invoices', icon: ReceiptText },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const content = (
    <div className="h-full flex flex-col bg-[#102F63] text-white w-[260px]">
      <div className="flex items-center justify-between px-5 pt-6 pb-2 md:hidden">
        <span className="text-sm font-medium text-white/80">القائمة</span>
        <button
          onClick={onClose}
          aria-label="إغلاق القائمة"
          className="text-white/70 hover:text-white p-1"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center text-center px-5 pt-6 pb-6 border-b border-white/10">
        <img src="/assets/logo.png" alt="مركز العيادات التخصصية" className="w-14 h-14 rounded-full mb-3" />
        <div className="text-[14px] font-semibold leading-snug">مركز العيادات التخصصية</div>
        <div className="text-[11px] text-white/60 mt-0.5">Specialized Clinics Center</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] transition-colors ${
                active
                  ? 'bg-white/12 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block shrink-0">{content}</aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute top-0 right-0 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
