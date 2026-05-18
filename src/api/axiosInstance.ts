import axios from 'axios';
import { BASE_URL } from '../config/env';
import { getTokens, clearTokens } from '../services/storageService';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async config => {
    try {
      const tokens = getTokens();

      if (tokens?.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
      }
    } catch (error) {
      console.log('Token attach error:', error);
    }

    return config;
  },
  error => Promise.reject(error)
);

// ❗ RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 🔥 HANDLE TOKEN EXPIRED (FUTURE READY)
    if (error.response?.status === 401) {
      console.log('Unauthorized - token expired');

      // 🚀 OPTIONAL (future):
      // try refresh token here

      // 🔐 fallback: logout user
      await clearTokens();

      console.log('User logged out due to invalid token');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;