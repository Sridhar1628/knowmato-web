import axios from "axios";
import { parseApiError } from "@/utils/errors/apiErrorParser.ts";

const axiosInstance = axios.create({
  baseURL: "https://api.knowmato.in/api/",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {

    if (typeof window !== "undefined") {

      let token: string | null = null;

      // ============================================
      // 1. Check saved tokens object
      // ============================================
      const storedTokens =
        localStorage.getItem("tokens");

      if (storedTokens) {

        try {

          const parsed =
            JSON.parse(storedTokens);

          token = parsed?.access || null;

        } catch (error) {

          console.log(
            "Token parse error:",
            error
          );
        }
      }

      // ============================================
      // 2. Mobile app → browser token
      // Example:
      // ?token=xxxxx&from_app=true
      // ============================================


      
      // ============================================
      // 3. Attach Authorization header
      // ============================================
      if (token) {

        config.headers.Authorization =
          `Bearer ${token}`;

        console.log("TOKEN FROM STORAGE:", token);

        console.log(
          "AUTH HEADER:",
          `Bearer ${token}`
        );
      }
      console.log(config.headers);
    }

    return config;
  },

  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Successful response
    return response;
  },

  (error) => {
    // Convert AxiosError -> AppError
    const parsedError = parseApiError(error);

    // Optional: log only in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", parsedError);
    }

    return Promise.reject(parsedError);
  }
);

export default axiosInstance;