import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] px-6 py-12">
      <div className="w-full max-w-[400px]">
        {/* Compact branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-lg font-bold text-[#102F63]">مركز العيادات التخصصية</h1>
        </div>

        <div className="ui-card p-7">
          <h2 className="text-[22px] font-bold text-[#102F63] mb-1">{t('login.title')}</h2>
          <p className="text-[13px] text-[#64748B] mb-6">{t('login.subtitle')}</p>

          {error && (
            <div className="mb-5 flex items-start gap-2 px-3.5 py-3 bg-red-50 border border-red-100 text-[#C4362B] rounded-[10px] text-[13px]">
              <AlertCircle size={16} className="shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#102F63] mb-2">{t('login.email')}</label>
              <div className="relative">
                <Mail size={17} strokeWidth={1.75} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="ui-input pr-11"
                  placeholder={t('login.emailPlaceholder')}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#102F63] mb-2">{t('login.password')}</label>
              <div className="relative">
                <Lock size={17} strokeWidth={1.75} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="ui-input pr-11 pl-11"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#173B78]"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-[#64748B] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#173B78] focus:ring-[#173B78]"
                  disabled={loading}
                />
                {t('login.rememberMe')}
              </label>
              <button type="button" className="text-[13px] text-[#173B78] hover:underline" disabled={loading}>
                {t('login.forgotPassword')}
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-[14px]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t('login.loggingIn')}
                </span>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
