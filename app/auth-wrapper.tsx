"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Only redirect if we're coming from auth flows
        const currentPath = window.location.pathname
        if (currentPath === "/login" || currentPath.startsWith("/register")) {
          router.replace("/onboarding")
        }
      } else if (event === "SIGNED_OUT") {
        router.replace("/signed-out")
      }
    })
    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe()
      }
    }
  }, [router])

  return <>{children}</>
}