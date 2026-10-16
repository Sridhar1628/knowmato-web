
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { parseApiError } from '@/utils/errors/apiErrorParser.ts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.knowmato.in/api/';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SAFE_METHODS = new Set(['get', 'head', 'options']);

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfRequest) {
    csrfRequest = axios
      .get(`${API_BASE_URL}accounts/web-session/csrf/`, {
        withCredentials: true,
        timeout: 30000,
      })
      .then((response) => {
        const token = response.data?.csrf_token;

        if (typeof token !== 'string' || !token) {
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

    const method = (config.method || 'get').toLowerCase();

    if (
      typeof window !== 'undefined' &&
      !SAFE_METHODS.has(method)
    ) {
      const token = await getCsrfToken();

      config.headers.set('X-CSRFToken', token);
    }

    // Never attach web JWTs to requests.
    config.headers.delete('Authorization');

    return config;
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      originalRequest &&
      !SAFE_METHODS.has(
        (originalRequest.method || 'get').toLowerCase(),
      )
    ) {
      // Refresh the CSRF token once and retry a CSRF-rejected request.
      const config = originalRequest as InternalAxiosRequestConfig & {
        _csrfRetry?: boolean;
      };

      if (
        !config._csrfRetry &&
        typeof window !== 'undefined'
      ) {
        config._csrfRetry = true;
        resetCsrfToken();

        try {
          const token = await getCsrfToken();
          config.headers.set('X-CSRFToken', token);
          return axiosInstance(config);
        } catch {
          // Return the original API error below.
        }
      }
    }

    return Promise.reject(parseApiError(error));
  },
);

export default axiosInstance;
