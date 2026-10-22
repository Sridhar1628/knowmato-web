import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { parseApiError } from '@/utils/errors/apiErrorParser.ts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.knowmato.in/api/';

const CSRF_URL = `${API_BASE_URL}accounts/web-session/csrf/`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SAFE_METHODS = new Set(['get', 'head', 'options']);

type RetryConfig = InternalAxiosRequestConfig & {
  _csrfRetry?: boolean;
};

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    csrfToken = null;
  }

  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfRequest) {
    csrfRequest = axios
      .get(CSRF_URL, {
        withCredentials: true,
        timeout: 30000,
        headers: {
          Accept: 'application/json',
        },
      })
      .then((response) => {
        const token =
          response.data?.csrf_token ??
          response.data?.csrfToken;

        if (typeof token !== 'string' || !token.trim()) {
          throw new Error('Unable to obtain CSRF token.');
        }

        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }

  return csrfRequest;
}

export function resetCsrfToken(): void {
  csrfToken = null;
}

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.withCredentials = true;

    // This web client must never send a locally stored JWT.
    config.headers.delete('Authorization');

    const method = (config.method || 'get').toLowerCase();

    if (
      typeof window !== 'undefined' &&
      !SAFE_METHODS.has(method) &&
      !config.url?.includes('accounts/web-session/csrf/')
    ) {
      const token = await getCsrfToken();
      config.headers.set('X-CSRFToken', token);
    }

    return config;
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(parseApiError(error));
    }

    const method = (originalRequest.method || 'get').toLowerCase();
    const responseData = error.response?.data as
      | { code?: string; detail?: string; message?: string }
      | undefined;

    const isCsrfFailure =
      error.response?.status === 403 &&
      (
        responseData?.code === 'CSRF_FAILED' ||
        /csrf|csrf token|csrf verification/i.test(
          `${responseData?.detail || ''} ${responseData?.message || ''}`,
        )
      );

    if (
      typeof window !== 'undefined' &&
      isCsrfFailure &&
      !SAFE_METHODS.has(method) &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;

      try {
        const token = await getCsrfToken(true);
        originalRequest.headers.set('X-CSRFToken', token);

        // Retry once only for a confirmed CSRF failure.
        return await axiosInstance(originalRequest);
      } catch {
        // Preserve the original request error.
      }
    }

    return Promise.reject(parseApiError(error));
  },
);

export default axiosInstance;