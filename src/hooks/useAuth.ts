"use client";

import { useEffect, useState } from "react";
import { getTokens } from "@/services/storageService";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "@/redux/slices/authSlice";
import { getProfile } from "@/services/userService";

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const tokens = getTokens();

        if (!tokens?.access) {
          dispatch(logout());
          return;
        }

        const res = await getProfile();

        const user = res?.data?.user ?? res?.user;

        if (!user) {
          throw new Error("User data not found in profile response");
        }

        dispatch(
          loginSuccess({
            access: tokens.access,
            refresh: tokens.refresh,
            user,
          })
        );
      } catch (err) {
        console.error("AUTH RESTORE ERROR:", err);
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [dispatch]);

  return { loading };
};