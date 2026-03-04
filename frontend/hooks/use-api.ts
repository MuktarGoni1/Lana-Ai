"use client";

import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { ApiError, NetworkError } from "@/lib/errors";

export function useApi() {
  const { toast } = useToast();

  const handleError = (error: unknown) => {
    let title = "Request Failed";
    let description = "An unexpected error occurred.";

    if (error instanceof ApiError) {
      title = `Error: ${error.status}`;
      description = error.message;
    } else if (error instanceof NetworkError) {
      title = "Network Error";
      description = error.message;
    } else if (error instanceof Error) {
      description = error.message;
    }

    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  return {
    async get<T>(url: string, options?: RequestInit, bypassCache = false): Promise<T> {
      try {
        return await apiClient.get<T>(url, options, bypassCache);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },

    async post<T, U = unknown>(url: string, body: U, options?: RequestInit): Promise<T> {
      try {
        return await apiClient.post<T, U>(url, body, options);
      } catch (error) {
        handleError(error);
        throw error;
      }
    }
  };
}