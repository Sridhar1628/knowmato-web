import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://kno/api",
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
      if (!token) {

        const params =
          new URLSearchParams(
            window.location.search
          );

        const urlToken =
          params.get("token");

        if (urlToken) {

          token = urlToken;

          // ✅ Save using YOUR structure
          localStorage.setItem(
            "tokens",
            JSON.stringify({
              access: urlToken,
              refresh: "",
            })
          );

          // ✅ Remove token from URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }

      // ============================================
      // 3. Attach Authorization header
      // ============================================
      if (token) {

        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },

  (error) => Promise.reject(error)
);

export default axiosInstance;