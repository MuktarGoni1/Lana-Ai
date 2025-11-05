"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase/client'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Only run auth subscription on the client side
    if (typeof window !== 'undefined') {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === "SIGNED_IN" && session) {
            // Only redirect if we're not already on a protected page
            const currentPath = window.location.pathname
            if (currentPath === "/login" || currentPath === "/register") {
              router.push("/homepage")
            }
          } else if (event === "SIGNED_OUT") {
            router.push("/landing-page")
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        }
      })
      return () => {
        if (listener?.subscription) {
          listener.subscription.unsubscribe()
        }
      }
    }
  }, [router])

  return <>{children}</>
}