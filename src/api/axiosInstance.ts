import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://api.knowmato.in/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(

  async (config) => {

    if (typeof window !== "undefined") {

      const token =
        localStorage.getItem(
          "access_token"
        );

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