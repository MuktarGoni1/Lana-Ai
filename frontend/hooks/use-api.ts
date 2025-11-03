"use client";

import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

export function useApi() {
  const { toast } = useToast();

  return {
    async get<T>(url: string, options?: RequestInit, bypassCache = false): Promise<T> {
      try {
        return await apiClient.get<T>(url, options, bypassCache);
      } catch (error) {
        toast({
          title: "Request Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
        throw error;
      }
    },

    async post<T, U = unknown>(url: string, body: U, options?: RequestInit): Promise<T> {
      try {
        return await apiClient.post<T, U>(url, body, options);
      } catch (error) {
        toast({
          title: "Request Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
        throw error;
      }
    }
  };
}