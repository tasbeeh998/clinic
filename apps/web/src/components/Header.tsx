import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, UserRound, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = user?.role === 'ADMIN' ? 'مدير النظام' : 'موظف استقبال';

  return (
    <header className="h-[72px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-5 md:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="فتح القائمة"
          className="md:hidden text-[#102F63] p-1.5 -mr-1.5"
        >
          <Menu size={22} />
        </button>
        <div className="hidden md:flex items-center gap-2.5">
          <img src="/assets/logo.png" alt="مركز العيادات التخصصية" className="w-9 h-9 rounded-full" />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#102F63]">مركز العيادات التخصصية</div>
            <div className="text-[10px] text-[#94A3B8]">Specialized Clinics Center</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button aria-label="الإشعارات" className="relative text-[#64748B] hover:text-[#102F63] p-1.5">
          <Bell size={19} strokeWidth={1.75} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-[#F6F8FC] rounded-lg px-2 py-1.5 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#173B78] text-white flex items-center justify-center">
              <UserRound size={16} strokeWidth={1.75} />
            </span>
            <span className="hidden sm:block text-right leading-tight">
              <span className="block text-[13px] font-semibold text-[#102F63]">{user?.name || 'المستخدم'}</span>
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
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
