import axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { getAccessToken, setAccessToken } from "./tokenManager";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  accessToken: string;
  user: unknown;
};

/**
 * A single shared refresh promise.
 *
 * If multiple requests receive 401 at the same time,
 * they will all wait for this same Promise instead of
 * creating multiple /auth/refresh requests.
 */
let refreshPromise: Promise<RefreshResponse> | null = null;

/**
 * API client
 */
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "https://movie-hub-edbk.onrender.com/api",

  /**
   * Required for the HttpOnly refresh-token cookie.
   */
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ----------------------------------------------------------
 * Refresh access token
 * ----------------------------------------------------------
 *
 * This function is the ONLY place responsible for
 * coordinating refresh requests.
 *
 * Important:
 * We use the normal axios instance instead of `api`
 * so the refresh request does not pass through the
 * response interceptor.
 */
export const refreshAccessToken = async (): Promise<RefreshResponse> => {
  /**
   * If a refresh request is already running,
   * return the same Promise.
   *
   * Example:
   *
   * Request A → 401 ─┐
   * Request B → 401 ─┼──→ ONE refresh request
   * Request C → 401 ─┘
   */
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post<RefreshResponse>(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true,
      },
    )
    .then((response) => {
      const accessToken = response.data?.accessToken;

      if (!accessToken) {
        throw new Error("Refresh response did not contain an access token");
      }

      /**
       * Store the new short-lived access token
       * in memory.
       */
      setAccessToken(accessToken);

      return response.data;
    })
    .catch((error) => {
      /**
       * Refresh failed.
       *
       * This usually means the refresh token is
       * expired, invalid, revoked, or missing.
       */
      setAccessToken(null);

      throw error;
    })
    .finally(() => {
      /**
       * Allow a future refresh operation.
       */
      refreshPromise = null;
    });

  return refreshPromise;
};

/**
 * ----------------------------------------------------------
 * Request interceptor
 * ----------------------------------------------------------
 *
 * Adds the current access token to every API request.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/**
 * ----------------------------------------------------------
 * Response interceptor
 * ----------------------------------------------------------
 *
 * Handles expired access tokens.
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    /**
     * We don't have the original request.
     */
    if (!originalRequest) {
      return Promise.reject(error);
    }

    /**
     * Only refresh for 401 Unauthorized.
     */
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    /**
     * Never refresh authentication endpoints.
     *
     * Otherwise a failed login/logout could
     * unnecessarily trigger /auth/refresh.
     */
    const url = originalRequest.url ?? "";

    if (
      url.includes("/auth/login") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    /**
     * Don't retry the same request more than once.
     */
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      /**
       * Get a fresh access token.
       *
       * If another request is already refreshing,
       * this waits for the same refresh Promise.
       */
      const { accessToken } = await refreshAccessToken();

      /**
       * Update Authorization header on the
       * original failed request.
       */
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      /**
       * Retry the original request.
       */
      return api(originalRequest);
    } catch (refreshError) {
      /**
       * Refresh failed.
       *
       * The original request should fail as well.
       */
      return Promise.reject(refreshError);
    }
  },
);

export default api;
