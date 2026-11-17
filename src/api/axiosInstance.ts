
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import { parseApiError } from '@/utils/errors/apiErrorParser.ts';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.knowmato.in/api/';

const CSRF_URL = `${API_BASE_URL}accounts/web-session/csrf/`;

const LOGIN_URL = 'accounts/web-session/login/';

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

async function getCsrfToken(
  forceRefresh = false,
): Promise<string> {
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

        if (
          typeof token !== 'string' ||
          !token.trim()
        ) {
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

/**
 * Clear the cached token.
 *
 * Django rotates its CSRF token after successful login.
 * The next unsafe request must obtain the current token.
 */
export function resetCsrfToken(): void {
  csrfToken = null;
}

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.withCredentials = true;

    // This web client must never send a locally stored JWT.
    config.headers.delete('Authorization');

    const method = (
      config.method || 'get'
    ).toLowerCase();

    if (
      typeof window !== 'undefined' &&
      !SAFE_METHODS.has(method) &&
      !config.url?.includes(
        'accounts/web-session/csrf/',
      )
    ) {
      const token = await getCsrfToken();

      config.headers.set('X-CSRFToken', token);
    }

    return config;
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    const requestUrl = response.config.url || '';

    /**
     * Django rotates the CSRF token during login.
     * Invalidate the old frontend cache only after
     * the successful login response has been received.
     *
     * The next POST/PUT/PATCH/DELETE request will
     * obtain the fresh token from the CSRF endpoint.
     */
    if (requestUrl.includes(LOGIN_URL)) {
      resetCsrfToken();
    }

    return response;
  },

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(parseApiError(error));
    }

    const method = (
      originalRequest.method || 'get'
    ).toLowerCase();

    const responseBody = error.response?.data;

    const responseData =
      responseBody &&
      typeof responseBody === 'object'
        ? responseBody as {
            code?: string;
            detail?: string;
            message?: string;
          }
        : undefined;

    /**
     * Django's CSRF middleware commonly returns HTML
     * instead of the application's JSON error format.
     * Recognize both response formats.
     */
    const responseText =
      typeof responseBody === 'string'
        ? responseBody
        : '';

    const errorText = [
      responseData?.detail || '',
      responseData?.message || '',
      responseText,
    ].join(' ');

    const isCsrfFailure =
      error.response?.status === 403 &&
      (
        responseData?.code === 'CSRF_FAILED' ||
        /csrf|csrf token|csrf verification|request aborted/i.test(
          errorText,
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
        // Obtain a fresh token and retry once.
        const token = await getCsrfToken(true);

        originalRequest.headers.set(
          'X-CSRFToken',
          token,
        );

        return await axiosInstance(originalRequest);
      } catch {
        // Preserve the original request error.
      }
    }

    return Promise.reject(parseApiError(error));
  },
);

export default axiosInstance;
