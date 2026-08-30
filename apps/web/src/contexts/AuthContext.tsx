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
    // On mount, try to refresh the session using the refresh token cookie
    // This recovers the session without needing localStorage for accessToken
    const recoverSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setAccessToken(data.accessToken);
          // Temporarily store in localStorage for service compatibility
          // This should be refactored to use context-based token management
          localStorage.setItem('accessToken', data.accessToken);
        }
      } catch (error) {
        // Session recovery failed - user needs to login
        console.error('Session recovery failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    recoverSession();
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

    // Store access token in memory only (no localStorage)
    // Refresh token is stored as HttpOnly cookie by the server
    setUser(data.user);
    setAccessToken(data.accessToken);
    // Temporarily store in localStorage for service compatibility
    localStorage.setItem('accessToken', data.accessToken);
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
      // Clear memory state and localStorage
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
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

      // Update both access token and user data from server
      setAccessToken(data.accessToken);
      if (data.user) {
        setUser(data.user);
      }
      // Temporarily store in localStorage for service compatibility
      localStorage.setItem('accessToken', data.accessToken);
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

