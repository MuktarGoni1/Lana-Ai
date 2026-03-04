'use client';

import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading } = useUnifiedAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (role !== 'parent' && role !== 'guardian') {
        toast({
          title: 'Access Denied',
          description: 'Only parents can access this area',
          variant: 'destructive',
        });
        router.push('/'); // Redirect non-parents to dashboard
      }
    }
  }, [role, isLoading, router, toast]);

  if (isLoading || (role !== 'parent' && role !== 'guardian')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/50">Checking authorization...</p>
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
