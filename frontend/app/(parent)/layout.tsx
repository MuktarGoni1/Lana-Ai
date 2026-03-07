'use client';

import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/50">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}
