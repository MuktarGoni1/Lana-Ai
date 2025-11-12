"use client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <p className="text-white/40 text-sm">Loading onboarding…</p>
      </div>
    </div>
  )
}