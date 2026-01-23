"use client"

import React from "react"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/db"
import { ArrowLeft, ArrowRight, ChevronLeft, Mail, User, Calendar, GraduationCap, Sparkles, Shield, Chrome, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { AuthService } from "@/lib/services/authService"
import { motion, AnimatePresence } from "framer-motion"
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext'

// Ensure this page is not statically generated
export const dynamic = 'force-dynamic';

// =============== SHARED COMPONENTS ===============

// Reusable components matching login page styling
const FormWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-black flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      {children}
    </div>
  </div>
);

const FormCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    suppressHydrationWarning
    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
             text-white placeholder-white/20 text-sm
             focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
             transition-all duration-200"
  />
);

const PrimaryButton = ({ 
  loading, 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...props}
    suppressHydrationWarning
    disabled={loading || props.disabled}
    className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
             hover:bg-white/90 transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center justify-center gap-2"
  >
    {loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </>
    ) : (
      <>
        {children}
        <ArrowRight className="h-4 w-4" />
      </>
    )}
  </button>
);

const SecondaryButton = ({ 
  loading, 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...props}
    suppressHydrationWarning
    disabled={loading || props.disabled}
    className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
             text-white font-medium text-sm
             hover:bg-white/[0.1] transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center justify-center gap-3"
  >
    {loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </>
    ) : (
      <>
        {children}
      </>
    )}
  </button>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    suppressHydrationWarning
    className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 
             transition-colors duration-200 mx-auto"
  >
    <ChevronLeft className="h-4 w-4" />
    Back to options
  </button>
);

const FormHeader = ({ 
  icon: Icon, 
  title, 
  subtitle 
}: { 
  icon: typeof Mail | typeof User;
  title: string;
  subtitle: string;
}) => (
  <div className="text-center space-y-3">
    <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
      <Icon className="w-7 h-7 text-white/70" />
    </div>
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="text-white/40 text-sm">{subtitle}</p>
    </div>
  </div>
);

// =============== PARENT FLOW ===============

function ParentFlow() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { loginWithGoogle } = useComprehensiveAuth()

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {}
    const emailValidation = z.string().email().safeParse(email.trim())
    
    if (!emailValidation.success) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Use a default origin for server-side rendering
      const redirectTo = "https://www.lanamind.com/auth/auto-login"

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: { role: "guardian" }
        }
      })

      if (error) throw error

      const { error: upsertError } = await (supabase as any)
        .from("guardians")
        .upsert({ email: email.trim(), weekly_report: true, monthly_report: false }, { onConflict: 'email' })
      
      if (upsertError) {
        console.warn('[Register Parent] Failed to upsert guardian record:', upsertError)
      }

      // Delay navigation to ensure form submission completes
      setTimeout(() => {
        router.push(`/register/magic-link-sent?email=${encodeURIComponent(email)}`)
      }, 100)
    } catch (error) {
      console.error("Parent registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send magic link. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Keep loading state for a bit longer to prevent UI flickering
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true)
      const result = await loginWithGoogle()
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to initiate Google registration. Please try again.",
          variant: "destructive",
        })
      } else {
        // For Google registration, the redirect happens automatically
        // Show a temporary message to inform the user
        toast({
          title: "Redirecting",
          description: "Redirecting to Google for authentication...",
        });
      }
      // Note: For OAuth, the redirect happens automatically
    } catch (error) {
      console.error("Parent Google registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate Google registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Keep loading state for a bit longer to prevent UI flickering
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }

  return (
    <FormWrapper>
      <FormCard>
        <form onSubmit={handleParent} suppressHydrationWarning className="space-y-6">
          <FormHeader 
            icon={Shield} 
            title="Parent Registration" 
            subtitle="Secure access to monitor your child's learning journey"
          />
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-white/40 mb-2">
                Email address
              </label>
              <StyledInput 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="parent@example.com" 
                required 
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.email}
                </p>
              )}
            </div>
            
            <PrimaryButton type="submit" loading={isLoading}>
              Send Magic Link
            </PrimaryButton>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>
            
            <SecondaryButton onClick={handleGoogleRegister} loading={isLoading}>
              <Chrome className="h-4 w-4" />
              Sign up with Google
            </SecondaryButton>
            
            <p className="text-xs text-white/20 text-center">
              We'll send you a secure login link to access your dashboard
            </p>
          </div>
          
          <BackButton onClick={() => router.push("/register")} />
        </form>
      </FormCard>
    </FormWrapper>
  )
}

// =============== MAIN COMPONENT ===============

function RegisterFormContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role")

  // Only show parent flow - redirect any child registration attempts to parent registration
  if (role === "child") {
    // Automatically redirect to parent registration
    useEffect(() => {
      const timer = setTimeout(() => {
        window.location.href = "/register/form?role=parent";
      }, 100); // Small delay to allow the redirect to process
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/50">Redirecting to parent registration...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {role === "parent" && <ParentFlow key="parent" />}
      {!role && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-black text-white flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-white/40">Invalid registration type</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function RegisterForm() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterFormContent />
    </Suspense>
  )
}