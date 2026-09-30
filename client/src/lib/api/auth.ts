import { CurrentUser, LoginCredentials } from "@/context/auth-context";
import api from "@/lib/axios";
import { setAccessToken } from "../tokenManager";
import axios from "axios";

export type AuthResponse = {
  accessToken: string;
  user: CurrentUser;
};

export type RefreshResponse<TUser = unknown> = {
  accessToken: string;
  user: TUser;
};

export const loginRequest = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);

  return response.data;
};

export const refreshRequest = async (): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/refresh", {});

  return response.data;
};

export const logoutRequest = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};

let refreshPromise: Promise<RefreshResponse> | null = null;

export const refreshSession = async <TUser = unknown>(): Promise<
  RefreshResponse<TUser>
> => {
  if (refreshPromise) {
    return refreshPromise as Promise<RefreshResponse<TUser>>;
  }

  refreshPromise = axios
    .post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      {
        withCredentials: true,
      },
    )
    .then((response) => {
      const data = response.data;

      const accessToken = data?.accessToken;

      if (!accessToken) {
        throw new Error("Refresh response did not contain an access token");
      }

      setAccessToken(accessToken);

      return {
        accessToken,
        user: data.user,
      };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise as Promise<RefreshResponse<TUser>>;
};
