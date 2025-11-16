import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
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
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to homepage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}