'use client';

import { useEffect, useState } from 'react';
import { getTokens } from '@/services/storageService';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '@/redux/slices/authSlice';
import { getProfile } from '@/services/userService';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const tokens = getTokens();

        console.log("TOKENS", tokens);

        if (!tokens?.access) {
          dispatch(logout());
          return;
        }

        const res = await getProfile();

        console.log("FULL RESPONSE", res);
        console.log("TYPE", typeof res);


        dispatch(
          loginSuccess({
            access: tokens.access,
            refresh: tokens.refresh,
            user: res.data,
          })
        );

      } catch (err) {
        console.log(err);
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [dispatch]);

  return { loading };
};