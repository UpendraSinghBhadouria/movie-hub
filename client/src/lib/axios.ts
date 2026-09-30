// import axios, { AxiosError } from "axios";
// import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// import { getAccessToken, setAccessToken } from "./tokenManager";

// type RetryableRequestConfig = InternalAxiosRequestConfig & {
//   _retry?: boolean;
// };

// type FailedQueueItem = {
//   resolve: (token: string) => void;
//   reject: (error: unknown) => void;
// };

// let isRefreshing = false;

// let failedQueue: FailedQueueItem[] = [];

// /**
//  * Process all requests waiting for token refresh.
//  */
// const processQueue = (error: unknown, token: string | null = null) => {
//   failedQueue.forEach((promise) => {
//     if (token) {
//       promise.resolve(token);
//     } else {
//       promise.reject(error);
//     }
//   });

//   failedQueue = [];
// };

// /**
//  * API client
//  */
// const api: AxiosInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8000/api",

//   // Required for HttpOnly refresh-token cookie
//   withCredentials: true,

//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// /**
//  * Request interceptor
//  *
//  * Adds the access token from memory to every request.
//  */
// api.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = getAccessToken();

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },

//   (error) => Promise.reject(error),
// );

// /**
//  * Response interceptor
//  *
//  * If API returns 401:
//  *
//  * 1. Start refresh request
//  * 2. Other failed requests wait in queue
//  * 3. Save new access token in memory
//  * 4. Retry failed requests
//  */
// api.interceptors.response.use(
//   (response) => response,

//   async (error: AxiosError) => {
//     const originalRequest = error.config as RetryableRequestConfig | undefined;

//     /**
//      * No request config
//      */
//     if (!originalRequest) {
//       return Promise.reject(error);
//     }

//     /**
//      * Only handle 401
//      */
//     if (error.response?.status !== 401) {
//       return Promise.reject(error);
//     }

//     /**
//      * Never try to refresh the refresh endpoint itself.
//      *
//      * Otherwise:
//      *
//      * /auth/refresh -> 401
//      *      ↓
//      * /auth/refresh -> 401
//      *      ↓
//      * infinite loop
//      */
//     if (originalRequest.url?.includes("/auth/refresh")) {
//       return Promise.reject(error);
//     }

//     /**
//      * Do not retry the same request more than once.
//      */
//     if (originalRequest._retry) {
//       return Promise.reject(error);
//     }

//     /**
//      * Another request is already refreshing.
//      *
//      * Wait for that refresh request.
//      */
//     if (isRefreshing) {
//       return new Promise<string>((resolve, reject) => {
//         failedQueue.push({
//           resolve,
//           reject,
//         });
//       })
//         .then((token) => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;

//           return api(originalRequest);
//         })
//         .catch((queueError) => {
//           return Promise.reject(queueError);
//         });
//     }

//     /**
//      * This request will perform the refresh.
//      */
//     originalRequest._retry = true;

//     isRefreshing = true;

//     try {
//       /**
//        * IMPORTANT:
//        *
//        * Use the normal axios instance here instead of `api`.
//        *
//        * This prevents the refresh request from going through
//        * the same response interceptor.
//        */
//       const response = await axios.post(
//         `${api.defaults.baseURL}/auth/refresh`,
//         {},
//         {
//           withCredentials: true,
//         },
//       );

//       /**
//        * Your backend returns:
//        *
//        * {
//        *   accessToken: "...",
//        *   user: {...}
//        * }
//        */
//       const newToken = response.data?.accessToken;

//       if (!newToken) {
//         throw new Error("Refresh response did not contain an access token");
//       }

//       /**
//        * Save access token in memory.
//        */
//       setAccessToken(newToken);

//       /**
//        * Release all queued requests.
//        */
//       processQueue(null, newToken);

//       /**
//        * Retry original request with new token.
//        */
//       originalRequest.headers.Authorization = `Bearer ${newToken}`;

//       return api(originalRequest);
//     } catch (refreshError) {
//       /**
//        * Refresh failed.
//        *
//        * The refresh cookie is invalid/expired.
//        */
//       processQueue(refreshError, null);

//       /**
//        * Clear memory token.
//        */
//       setAccessToken(null);

//       return Promise.reject(refreshError);
//     } finally {
//       isRefreshing = false;
//     }
//   },
// );

// export default api;

import axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { getAccessToken, setAccessToken } from "./tokenManager";
import { refreshSession } from "./api/auth";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;

let failedQueue: FailedQueueItem[] = [];

/**
 * Process all requests waiting for token refresh.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });

  failedQueue = [];
};

/**
 * API client
 */
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8000/api",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor
 *
 * Adds the access token from memory to every request.
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
 * Refresh access token.
 *
 * This function is shared by:
 *
 * 1. AuthProvider session restoration
 * 2. Axios 401 interceptor
 *
 * This prevents multiple refresh requests from happening
 * at the same time.
 */
export const refreshAccessToken = async (): Promise<string> => {
  /**
   * If another refresh request is already running,
   * wait for that request instead of creating another one.
   */
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({
        resolve,
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    /**
     * Use normal axios instead of api.
     *
     * This prevents the refresh request from entering
     * the 401 interceptor.
     */
    const response = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true,
      },
    );

    const newToken = response.data?.accessToken;

    if (!newToken) {
      throw new Error("Refresh response did not contain an access token");
    }

    /**
     * Save new access token in memory.
     */
    setAccessToken(newToken);

    /**
     * Release all requests waiting for refresh.
     */
    processQueue(null, newToken);

    return newToken;
  } catch (refreshError) {
    /**
     * Refresh failed.
     */
    processQueue(refreshError, null);

    setAccessToken(null);

    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Response interceptor
 *
 * If API returns 401:
 *
 * 1. Start refresh request
 * 2. Other failed requests wait for the same refresh
 * 3. Save new access token in memory
 * 4. Retry failed request
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    /**
     * No request config
     */
    if (!originalRequest) {
      return Promise.reject(error);
    }

    /**
     * Only handle 401
     */
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    /**
     * Never refresh the refresh endpoint itself.
     */
    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    /**
     * Do not retry the same request more than once.
     */
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      /**
       * Get a new access token.
       *
       * If another refresh is already running,
       * this waits for it.
       */
      const { accessToken } = await refreshSession();

      /**
       * Retry original request.
       */
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
