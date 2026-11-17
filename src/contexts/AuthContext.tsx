'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
  useRef,
} from 'react';

import { checkAuthentication } from '@/services/userService';

export type AuthRole = 'student' | 'tutor' | 'admin' | 'company';

export interface AuthUser {
  id: number;
  email?: string;
  role: AuthRole;
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
  setAuthenticatedUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VALID_ROLES = new Set<AuthRole>([
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
      VALID_ROLES.has(role as AuthRole)
    ) {
      return {
        ...candidate,
        id,
        role: role as AuthRole,
      } as AuthUser;
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

  // Prevent an older initial profile request from overwriting a newer login.
  const authRequestVersion = useRef(0);

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    authRequestVersion.current += 1;
    setUser(authenticatedUser);
    setLoading(false);

    console.log('[AUTH DEBUG] Authentication context updated from login:', {
      id: authenticatedUser.id,
      role: authenticatedUser.role,
      authenticated: true,
    });
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    const requestVersion = ++authRequestVersion.current;

    try {
      console.log('[AUTH DEBUG] Checking authenticated account...');

      const response = await checkAuthentication();

      console.log('[AUTH DEBUG] Profile API response:', response);

      const profile = extractAuthUser(response);

      console.log('[AUTH DEBUG] Extracted authenticated user:', {
        id: profile?.id,
        role: profile?.role,
        authenticated: Boolean(profile),
      });

      // Ignore stale responses if a login happened while this request was pending.
      if (requestVersion === authRequestVersion.current) {
        setUser(profile);
      }
    } catch (error) {
      console.error('[AUTH DEBUG] Profile request failed:', error);

      if (requestVersion === authRequestVersion.current) {
        setUser(null);
      }
    } finally {
      if (requestVersion === authRequestVersion.current) {
        setLoading(false);
      }
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
        setAuthenticatedUser,
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
