import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Login() {
  const navigate = useNavigate();
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }

      // Store access token and user in session storage
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F7FA] dir-rtl">
      <div className="w-full max-w-[400px] p-8">
        {/* Clinic Logo and Name */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#4B5694] rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">ط</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111844]">اسم المركز الطبي</h1>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-[#FBEAE8] border border-[#C4362B] text-[#C4362B] rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#111844] mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-[#C9CEDC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4B5694] focus:border-transparent text-[#111844]"
                placeholder="أدخل البريد الإلكتروني"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#111844] mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-[#C9CEDC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4B5694] focus:border-transparent text-[#111844]"
                  placeholder="أدخل كلمة المرور"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5B6478] hover:text-[#4B5694]"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 text-[#4B5694] border-[#C9CEDC] rounded focus:ring-[#4B5694]"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="mr-2 text-sm text-[#5B6478]">
                تذكرني
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4B5694] text-white py-3 rounded-md font-medium hover:bg-[#3d4a7d] focus:outline-none focus:ring-2 focus:ring-[#4B5694] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                'تسجيل الدخول'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-[#4B5694] hover:underline"
                disabled={loading}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
