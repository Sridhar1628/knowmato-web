'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import {
  checkAuthentication,
} from '@/services/userService';

import {
  clearTokens,
  getTokens,
} from '@/services/storageService';

interface AuthUser {
  id: number;
  email: string;
  role:
    | 'student'
    | 'tutor'
    | 'admin'
    | 'company';

  display_name?: string;
  first_name?: string;
  phone?: string;
  profile?: any;
  wallet_balance?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | null>(
    null
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshAuth =
    async (): Promise<void> => {

      // ------------------------------------------
      // Check browser
      // ------------------------------------------

      if (
        typeof window === 'undefined'
      ) {
        return;
      }

      // ------------------------------------------
      // Get stored tokens
      // ------------------------------------------

      const tokens = getTokens();

      if (!tokens?.access) {

        setUser(null);
        setLoading(false);

        return;
      }

      setLoading(true);

      try {

        // ----------------------------------------
        // Axios will automatically refresh
        // the access token if required.
        // ----------------------------------------

        const res =
          await checkAuthentication();

        console.log(
          'AUTH RESPONSE:',
          res
        );

        const profile =
          res?.data?.user ??
          null;

        if (!profile) {
          throw new Error(
            'Authentication profile not found.'
          );
        }

        setUser(profile);

      } catch (error) {

        console.error(
          'AUTH ERROR:',
          error
        );

        /*
         * IMPORTANT:
         *
         * Do NOT blindly clear tokens here.
         *
         * Axios already attempted the refresh
         * when the access token returned 401.
         *
         * If Axios reaches here after refresh
         * failed, the token storage has already
         * been cleared.
         */

        const currentTokens =
          getTokens();

        if (!currentTokens?.access) {
          setUser(null);
        }

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

  const context =
    useContext(AuthContext);

  if (!context) {

    throw new Error(
      'useAuthContext must be used inside AuthProvider'
    );

  }

  return context;
}