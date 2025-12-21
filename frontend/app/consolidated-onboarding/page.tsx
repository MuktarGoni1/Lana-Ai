"use client";

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

// Dynamically import the component to avoid SSR issues
const ConsolidatedOnboarding = dynamic(
  () => import('@/components/consolidated-onboarding'),
  { ssr: false, loading: () => <div>Loading...</div> }
);

export default function ConsolidatedOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useEnhancedAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ConsolidatedOnboarding />;
}