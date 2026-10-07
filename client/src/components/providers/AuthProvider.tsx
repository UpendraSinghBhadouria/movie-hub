"use client";

import {
  AUTH_QUERY_KEY,
  AuthContext,
  AuthContextValue,
  CurrentUser,
  LoginCredentials,
} from "@/context/auth-context";

import { loginRequest, logoutRequest } from "@/lib/api/auth";

import { refreshAccessToken } from "@/lib/axios";

import { getErrorMessage } from "@/lib/getErrorMessage";
import { setAccessToken } from "@/lib/tokenManager";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isError, setIsError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  /**
   * --------------------------------------------------------
   * Restore existing session
   * --------------------------------------------------------
   *
   * On application startup:
   *
   * 1. Access token may be missing because it is stored
   *    only in memory.
   *
   * 2. Browser still has the HttpOnly refresh cookie.
   *
   * 3. refreshAccessToken() sends the refresh request.
   *
   * 4. New access token is stored in memory.
   *
   * 5. Current user is stored in React Query.
   */
  const sessionQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,

    queryFn: async () => {
      const response = await refreshAccessToken();

      return response.user as CurrentUser;
    },

    /**
     * If refresh token is missing/expired/invalid,
     * don't retry automatically.
     */
    retry: false,

    /**
     * Don't automatically refresh the session whenever
     * browser window gets focus.
     */
    refetchOnWindowFocus: false,

    /**
     * Treat the current user as fresh for 5 minutes.
     */
    staleTime: 5 * 60 * 1000,
  });

  /**
   * --------------------------------------------------------
   * Login
   * --------------------------------------------------------
   */
  const loginMutation = useMutation({
    mutationFn: loginRequest,

    onSuccess: (response) => {
      const { accessToken, user } = response;

      /**
       * Store access token in memory.
       */
      setAccessToken(accessToken);

      /**
       * Store current user in React Query.
       */
      queryClient.setQueryData(AUTH_QUERY_KEY, user);

      setIsError(null);
    },

    onError: (error) => {
      const errorMessage = getErrorMessage(error);

      console.log("Login error:", errorMessage);

      setIsError(errorMessage);
    },
  });

  /**
   * --------------------------------------------------------
   * Logout
   * --------------------------------------------------------
   */
  const logoutMutation = useMutation({
    mutationFn: logoutRequest,

    onSettled: () => {
      /**
       * Remove access token from memory.
       */
      setAccessToken(null);

      /**
       * Remove authenticated user from React Query.
       */
      queryClient.removeQueries({
        queryKey: AUTH_QUERY_KEY,
      });
    },
  });

  /**
   * --------------------------------------------------------
   * Public login function
   * --------------------------------------------------------
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<CurrentUser> => {
      const response = await loginMutation.mutateAsync(credentials);

      return response.user;
    },
    [loginMutation],
  );

  /**
   * --------------------------------------------------------
   * Public logout function
   * --------------------------------------------------------
   */
  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  /**
   * --------------------------------------------------------
   * Auth context value
   * --------------------------------------------------------
   */
  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: sessionQuery.data ?? null,

      isAuthenticated: !!sessionQuery.data,

      isLoading:
        sessionQuery.isLoading ||
        loginMutation.isPending ||
        logoutMutation.isPending,

      isError,

      login,

      logout,
    }),
    [
      sessionQuery.data,
      sessionQuery.isLoading,
      loginMutation.isPending,
      logoutMutation.isPending,
      isError,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
