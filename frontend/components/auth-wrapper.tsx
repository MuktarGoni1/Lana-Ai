"use client"
import React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === "SIGNED_IN") {
        router.push("/")
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [router])

  return <>{children}</>
}