'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (role !== 'parent') {
        toast({
          title: 'Access Denied',
          description: 'Only parents can access this area',
          variant: 'destructive',
        });
        router.push('/login'); // Redirect non-parents
      }
    }
  }, [role, isLoading, router, toast]);

  if (isLoading || role !== 'parent') {
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