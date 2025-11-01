"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { validateEnv } from "@/lib/env";
import AuthWrapper from "@/components/auth-wrapper";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Run environment validation only on the client
    const isValid = validateEnv();
    if (!isValid) {
      console.warn('[env] Environment validation failed');
    }
  }, []);

  return (
    <>
      <AuthWrapper>{children}</AuthWrapper>
      <Toaster />
    </>
  );
}