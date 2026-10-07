import { CurrentUser, LoginCredentials } from "@/context/auth-context";
import api from "@/lib/axios";

export type AuthResponse = {
  accessToken: string;
  user: CurrentUser;
};

export const loginRequest = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);

  return response.data;
};

export const logoutRequest = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};
