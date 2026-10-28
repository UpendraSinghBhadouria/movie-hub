import { CurrentUser, LoginCredentials } from "@/context/auth-context";
import api from "@/lib/axios";

export type AuthResponse = {
  accessToken: string;
  user: CurrentUser;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
  mobile?: string | null;
};

export const loginRequest = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);

  return response.data;
};

export const registerRequest = async (
  credentials: RegisterCredentials,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", credentials);
  return response.data;
};

export const logoutRequest = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};
