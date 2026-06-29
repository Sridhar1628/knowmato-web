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
    console.log("🔥 useAuth mounted");

    const loadUser = async () => {
      console.log("🔥 loadUser called");

      try {
        const tokens = getTokens();

        console.log("🔥 Tokens:", tokens);

        if (tokens?.access) {
          console.log("🔥 Fetching profile...");

          const res = await getProfile();

          console.log("🔥 Profile Response:", res);

          dispatch(
            loginSuccess({
              access: tokens.access,
              refresh: tokens.refresh,
              user: res.data.data,
            })
          );

          console.log("🔥 Redux Updated");
        } else {
          console.log("❌ No Tokens");
        }
      } catch (err) {
        console.log("❌ useAuth Error:", err);
      }
    };

    loadUser();
  }, []);

  
  return { loading };
};