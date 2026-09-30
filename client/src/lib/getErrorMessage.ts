import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong.",
): string => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return (
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      axiosError.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
