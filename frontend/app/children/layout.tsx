'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export default function ChildrenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      const userRole = user?.user_metadata?.role;
      if (userRole === 'guardian' || userRole === 'parent') {
        setHasPermission(true);
      } else {
        // Redirect non-guardian/parent users
        router.push('/homepage'); // or another appropriate page
        setHasPermission(false);
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || hasPermission === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return null;
}