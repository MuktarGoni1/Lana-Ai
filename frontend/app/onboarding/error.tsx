"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  useEffect(() => {
    // Log for diagnostics; could pipe to monitoring later
    console.error('[onboarding] route error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="space-y-4 text-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-white/50 text-sm">Please try again in a moment.</p>
        <div className="flex gap-2 justify-center">
          <button
            className="px-4 py-2 rounded-md bg-white text-black text-sm hover:bg-white/90"
            onClick={() => reset()}
          >
            Retry
          </button>
          <button
            className="px-4 py-2 rounded-md border border-white/20 text-white text-sm hover:bg-white/10"
            onClick={() => router.replace('/login')}
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}