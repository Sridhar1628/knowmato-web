
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';

import { checkAuthentication } from '@/services/userService';

interface AuthUser {
  id: number;
  email: string;
  role: 'student' | 'tutor' | 'admin' | 'company';
  display_name?: string;
  first_name?: string;
  phone?: string;
  profile?: any;
  wallet_balance?: number;
  knowmato_plus_enabled?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    setLoading(true);

    try {
      const response = await checkAuthentication();
      const profile = response?.data?.user;

      if (!profile) {
        setUser(null);
        return;
      }

      setUser(profile as AuthUser);
    } catch {
      // A failed session check means the web session is not usable.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: Boolean(user),
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return context;
}
