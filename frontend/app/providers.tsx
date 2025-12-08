"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { validateEnv } from "@/lib/env";
import AuthWrapper from "./auth-wrapper";
import { UnifiedAuthProvider } from "@/contexts/UnifiedAuthContext";
import { AuthIndicator } from "@/components/auth-indicator";
import { PersistentAuthReminder } from "@/components/persistent-auth-reminder";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      // Run environment validation only on the client
      const isValid = validateEnv();
      if (!isValid) {
        console.warn('[env] Environment validation failed');
      }
    } catch (error) {
      console.error('[env] Environment validation error:', error);
    }
  }, []);

  return (
    <UnifiedAuthProvider>
      <AuthWrapper>{children}</AuthWrapper>
      <AuthIndicator />
      <PersistentAuthReminder />
      <Toaster />
    </UnifiedAuthProvider>
  );
}