'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
        <p className="text-muted-foreground">
          We're sorry, but something unexpected happened. Our team has been notified and is working on fixing it.
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
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  )
}