// "use client";

// import {
//   AUTH_QUERY_KEY,
//   AuthContext,
//   AuthContextValue,
//   CurrentUser,
//   LoginCredentials,
// } from "@/context/auth-context";
// import { loginRequest, logoutRequest, refreshRequest } from "@/lib/api/auth";
// import { getErrorMessage } from "@/lib/getErrorMessage";
// import { setAccessToken } from "@/lib/tokenManager";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { error } from "console";
// import { useCallback, useMemo, useState } from "react";

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [isError, setIsError] = useState<string | null>(null);
//   const queryClient = useQueryClient();

//   const sessionQuery = useQuery({
//     queryKey: AUTH_QUERY_KEY,

//     queryFn: async () => {
//       const response = await refreshRequest();

//       const { accessToken, user } = response;
//       setAccessToken(accessToken);

//       return user;
//     },

//     /**
//      * If refresh cookie doesn't exist or is invalid,
//      * user is simply unauthenticated.
//      */
//     retry: false,
//     refetchOnWindowFocus: false,
//     staleTime: 5 * 60 * 1000,
//   });

//   const loginMutation = useMutation({
//     mutationFn: loginRequest,

//     onSuccess: (response) => {
//       const { accessToken, user } = response;
//       setAccessToken(accessToken);
//       queryClient.setQueryData(AUTH_QUERY_KEY, user);
//     },
//     onError: (err) => {
//       const errMsg = getErrorMessage(err);
//       setIsError(errMsg);
//     },
//   });

//   const logoutMutation = useMutation({
//     mutationFn: logoutRequest,

//     onSettled: () => {
//       setAccessToken(null);
//       queryClient.removeQueries({
//         queryKey: AUTH_QUERY_KEY,
//       });
//     },
//   });

//   const login = useCallback(
//     async (credentials: LoginCredentials): Promise<CurrentUser> => {
//       const response = await loginMutation.mutateAsync(credentials);
//       return response.user;
//     },
//     [loginMutation],
//   );

//   const logout = useCallback(async () => {
//     await logoutMutation.mutateAsync();
//   }, [logoutMutation]);

//   const value = useMemo<AuthContextValue>(
//     () => ({
//       currentUser: sessionQuery.data ?? null,
//       isAuthenticated: !!sessionQuery.data,
//       isLoading:
//         sessionQuery.isLoading ||
//         loginMutation.isPending ||
//         logoutMutation.isPending,
//       isError,
//       login,
//       logout,
//     }),
//     [
//       sessionQuery.data,
//       sessionQuery.isLoading,
//       loginMutation.isPending,
//       logoutMutation.isPending,
//       isError,
//       login,
//       logout,
//     ],
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

"use client";

import {
  AUTH_QUERY_KEY,
  AuthContext,
  AuthContextValue,
  CurrentUser,
  LoginCredentials,
} from "@/context/auth-context";
import { loginRequest, logoutRequest, refreshSession } from "@/lib/api/auth";
import api, { refreshAccessToken } from "@/lib/axios";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { setAccessToken } from "@/lib/tokenManager";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isError, setIsError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,

    queryFn: async () => {
      console.log("[AUTH] Refresh started");

      const response = await refreshSession<CurrentUser>();

      console.log("[AUTH] Refresh response:", response);

      setAccessToken(response.accessToken);

      console.log("[AUTH] Access token stored");
      console.log("[AUTH] User:", response.user);

      return response.user;
    },

    /**
     * If refresh cookie doesn't exist or is invalid,
     * user is simply unauthenticated.
     */
    retry: false,

    refetchOnWindowFocus: false,

    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,

    onSuccess: (response) => {
      const { accessToken, user } = response;

      setAccessToken(accessToken);

      queryClient.setQueryData(AUTH_QUERY_KEY, user);

      setIsError(null);
    },

    onError: (err) => {
      const errMsg = getErrorMessage(err);

      setIsError(errMsg);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,

    onSettled: () => {
      setAccessToken(null);

      queryClient.removeQueries({
        queryKey: AUTH_QUERY_KEY,
      });
    },
  });

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<CurrentUser> => {
      const response = await loginMutation.mutateAsync(credentials);

      return response.user;
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

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
