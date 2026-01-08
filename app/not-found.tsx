'use client';

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check authentication status from localStorage or cookie
    // This is a client-side only check since not-found runs during build
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user_data');
      const sessionData = localStorage.getItem('sb-uikpbxusqwlqkujwjupf-auth-token');
      
      if (userData || sessionData) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      // If there's an error accessing localStorage, assume not authenticated
      setIsAuthenticated(false);
    }
  }, []);

  // Default to homepage if client is authenticated, otherwise landing page
  const redirectUrl = isClient && isAuthenticated ? '/homepage' : '/';
  const buttonText = isClient && isAuthenticated ? 'Go to homepage' : 'Go to landing page';

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <Search className="h-10 w-10 text-white/60" />
          <LoadingSpinner size="md" />
        </div>
        <h2 className="text-2xl font-bold text-white">Page not found</h2>
        <p className="text-white/50">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 mt-6">
          <Button asChild className="w-full">
            <Link href={redirectUrl}>
              <Home className="mr-2 h-4 w-4" />
              {buttonText}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}