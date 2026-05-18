'use client';

import { useEffect, useState } from 'react';
import { getTokens } from '@/services/storageService';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/redux/slices/authSlice';
import { getProfile } from '@/services/userService';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const tokens = getTokens(); // ❗ no await

        if (tokens?.access) {
          const res = await getProfile();

          dispatch(
            loginSuccess({
              access: tokens.access,
              refresh: tokens.refresh,
              user: res.data,
            })
          );
        }
      } catch (error) {
        console.log('Auth load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { loading };
};