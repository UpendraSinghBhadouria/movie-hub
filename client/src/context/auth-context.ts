"use client";

import { RegisterCredentials } from "@/lib/api/auth";
import { createContext } from "react";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  role?: "USER" | "ADMIN";
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export const AUTH_QUERY_KEY = ["auth", "current-user"] as const;

export type AuthContextValue = {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: string | null;
  login: (credentials: LoginCredentials) => Promise<CurrentUser>;
  register: (credentials: RegisterCredentials) => Promise<CurrentUser>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
