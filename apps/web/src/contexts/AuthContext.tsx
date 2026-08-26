import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RECEPTIONIST';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('accessToken');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // Store access token and user in session storage (access token in memory is fine)
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('user', JSON.stringify(data.user));

    setUser(data.user);
    setAccessToken(data.accessToken);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear storage
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');

      setUser(null);
      setAccessToken(null);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      sessionStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
