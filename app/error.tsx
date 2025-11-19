'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error)
    // Default: auto-redirect users to homepage after brief delay
    const timer = setTimeout(() => {
      console.warn('Redirecting to homepage due to error')
      try {
        window.location.assign('/homepage')
      } catch {
        window.location.href = '/homepage'
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex items-center justify-center gap-4">
          <AlertTriangle className="h-10 w-10 text-white/60" />
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-white/50">
          We hit an unexpected issue. You can try again or head back home.
        </p>
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={() => reset()}
            className="w-full"
          >
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.assign('/homepage')}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  )
}