'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';



import { checkAuthentication } from '@/services/userService';
import { clearTokens, getTokens } from '@/services/storageService';

interface AuthUser {
  id: number;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  display_name?: string;
  first_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    const tokens = getTokens();

    if (!tokens?.access) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await checkAuthentication();

      console.log("AUTH RESPONSE:", res);

      if (!res.success || !res.user) {
        throw new Error("Authentication failed");
      }

      setUser(res.user);

    } catch (error) {
      console.error(error);

      clearTokens();
      setUser(null);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
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
      'useAuthContext must be used inside AuthProvider'
    );
  }

  return context;
}