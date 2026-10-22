
"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "@/redux/slices/authSlice";
import { getProfile } from "@/services/userService";

const VALID_ROLES = new Set([
  "student",
  "tutor",
  "admin",
  "company",
]);

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const response = await getProfile();
        const user =
          response?.data?.user ??
          response?.user ??
          response?.data;

        const id = Number(user?.id ?? user?.user_id);
        const role = user?.role;

        if (
          !user ||
          !Number.isInteger(id) ||
          id <= 0 ||
          typeof role !== "string" ||
          !VALID_ROLES.has(role)
        ) {
          throw new Error("Invalid authenticated profile response.");
        }

        if (active) {
          dispatch(
            loginSuccess({
              user: { ...user, id, role },
            })
          );
        }
      } catch (error) {
        console.error("[AUTH RESTORE ERROR]", error);

        if (active) {
          dispatch(logout());
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, [dispatch]);

  return { loading };
};
