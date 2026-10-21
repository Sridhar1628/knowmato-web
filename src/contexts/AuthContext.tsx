 'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
} from 'react';

import { checkAuthentication } from '@/services/userService';

interface AuthUser {
  id: number;
  email?: string;
  role: 'student' | 'tutor' | 'admin' | 'company';
  display_name?: string;
  first_name?: string;
  phone?: string;
  profile?: unknown;
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

const VALID_ROLES = new Set([
  'student',
  'tutor',
  'admin',
  'company',
]);

function extractAuthUser(response: any): AuthUser | null {
  const candidates = [
    response?.user,
    response?.data?.user,
    response?.data?.data?.user,
    response?.data,
    response?.data?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;

    const id = Number(candidate.id ?? candidate.user_id);
    const role = candidate.role;

    if (
      Number.isInteger(id) &&
      id > 0 &&
      typeof role === 'string' &&
      VALID_ROLES.has(role)
    ) {
      return { ...candidate, id, role } as AuthUser;
    }
  }

  return null;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      const response = await checkAuthentication();
      setUser(extractAuthUser(response));
    } catch {
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
    throw new Error(
      'useAuthContext must be used inside AuthProvider',
    );
  }

  return context;
}