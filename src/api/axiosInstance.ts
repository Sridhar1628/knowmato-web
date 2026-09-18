import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { parseApiError } from "@/utils/errors/apiErrorParser.ts";
import {
  getTokens,
  saveTokens,
  clearTokens,
} from '@/services/storageService';

const axiosInstance = axios.create({
  baseURL: 'https://api.knowmato.in/api/',
  timeout: 30000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================
// REFRESH CONTROL
// =====================================================

let isRefreshing = false;

type FailedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let failedQueue: FailedRequest[] = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach(
    ({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    }
  );

  failedQueue = [];
};

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

axiosInstance.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ) => {

    if (
      typeof window === 'undefined'
    ) {
      return config;
    }

    const tokens = getTokens();

    if (tokens?.access) {

      config.headers.Authorization =
        `Bearer ${tokens.access}`;

    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

axiosInstance.interceptors.response.use(

  (response) => {
    return response;
  },

  async (error: AxiosError) => {

    const originalRequest =
      error.config as
        | (InternalAxiosRequestConfig & {
            _retry?: boolean;
          })
        | undefined;

    // ---------------------------------------------
    // No request information
    // ---------------------------------------------

    if (!originalRequest) {
      return Promise.reject(
        parseApiError(error)
      );
    }

    // ---------------------------------------------
    // Only handle 401
    // ---------------------------------------------

    if (
      error.response?.status !== 401
    ) {

      const parsedError =
        parseApiError(error);

      if (
        process.env.NODE_ENV ===
        'development'
      ) {
        console.error(
          'API Error:',
          parsedError
        );
      }

      return Promise.reject(
        parsedError
      );
    }

    // ---------------------------------------------
    // Never refresh the refresh endpoint itself
    // ---------------------------------------------

    if (
      originalRequest.url?.includes(
        'accounts/token/refresh/'
      )
    ) {

      clearTokens();

      return Promise.reject(
        parseApiError(error)
      );
    }

    // ---------------------------------------------
    // Prevent infinite retry
    // ---------------------------------------------

    if (originalRequest._retry) {

      clearTokens();

      return Promise.reject(
        parseApiError(error)
      );
    }

    originalRequest._retry = true;

    // ---------------------------------------------
    // Get current refresh token
    // ---------------------------------------------

    const tokens = getTokens();

    if (!tokens?.refresh) {

      clearTokens();

      return Promise.reject(
        parseApiError(error)
      );
    }

    // ---------------------------------------------
    // Another request is already refreshing
    // ---------------------------------------------

    if (isRefreshing) {

      return new Promise(
        (
          resolve,
          reject
        ) => {

          failedQueue.push({
            resolve,
            reject,
          });

        }
      ).then((newAccessToken) => {

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return axiosInstance(
          originalRequest
        );

      });
    }

    // ---------------------------------------------
    // Start refresh
    // ---------------------------------------------

    isRefreshing = true;

    try {

      const refreshResponse =
        await axios.post(
          'https://api.knowmato.in/api/accounts/token/refresh/',
          {
            refresh: tokens.refresh,
          },
          {
            headers: {
              'Content-Type':
                'application/json',
            },
          }
        );

      const newAccessToken =
        refreshResponse.data?.access;

      const newRefreshToken =
        refreshResponse.data?.refresh ||
        tokens.refresh;

      if (!newAccessToken) {
        throw new Error(
          'No access token received during refresh.'
        );
      }

      // -------------------------------------------
      // IMPORTANT:
      // Save rotated refresh token too
      // -------------------------------------------

      saveTokens(
        newAccessToken,
        newRefreshToken
      );

      processQueue(
        null,
        newAccessToken
      );

      // -------------------------------------------
      // Retry original request
      // -------------------------------------------

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return axiosInstance(
        originalRequest
      );

    } catch (refreshError) {

      processQueue(
        refreshError,
        null
      );

      clearTokens();

      return Promise.reject(
        parseApiError(refreshError)
      );

    } finally {

      isRefreshing = false;

    }
  }
);

export default axiosInstance;