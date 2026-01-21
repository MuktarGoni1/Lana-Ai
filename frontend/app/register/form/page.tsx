"use client"

import React from "react"
import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/db"
import { ArrowRight, ChevronLeft, Mail, User, Calendar, GraduationCap, Sparkles, Shield, Chrome } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { AuthService } from "@/lib/services/authService"
import { motion, AnimatePresence } from "framer-motion"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"

// =============== SHARED COMPONENTS ===============

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`relative backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl ${className}`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        {children}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl ${className}`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </motion.div>
  )
}

const FormInput = ({ 
  icon: Icon, 
  label, 
  error,
  ...props 
}: { 
  icon?: React.ElementType
  label: string
  error?: string
  [key: string]: any 
}) => (
  <div className="space-y-2">
    <label htmlFor={props.id} className="block text-sm font-medium text-white/70">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        {...props}
        className={`
          w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl 
          bg-white/[0.03] border ${error ? 'border-red-500/50' : 'border-white/[0.05]'}
          text-white placeholder-white/20 text-sm
          focus:outline-none focus:border-white/20 focus:bg-white/[0.05]
          hover:bg-white/[0.04] hover:border-white/10
          transition-all duration-300
        `}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 left-0 text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  </div>
)

const FormSelect = ({ 
  icon: Icon, 
  label, 
  error,
  children,
  ...props 
}: { 
  icon?: React.ElementType
  label: string
  error?: string
  children: React.ReactNode
  [key: string]: any 
}) => (
  <div className="space-y-2">
    <label htmlFor={props.id} className="block text-sm font-medium text-white/70">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors pointer-events-none z-10">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <select
        {...props}
        className={`
          w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-3 rounded-xl appearance-none
          bg-white/[0.03] border ${error ? 'border-red-500/50' : 'border-white/[0.05]'}
          text-white text-sm cursor-pointer
          focus:outline-none focus:border-white/20 focus:bg-white/[0.05]
          hover:bg-white/[0.04] hover:border-white/10
          transition-all duration-300
          [&>option]:bg-black [&>option]:text-white
        `}
      >
        {children}
      </select>
      <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 rotate-180 w-4 h-4 text-white/20 pointer-events-none" />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 left-0 text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  </div>
)

const SubmitButton = ({ loading, children, loadingText }: { loading: boolean; children: React.ReactNode; loadingText: string }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <button
        type="submit"
        disabled={loading}
        className="
          relative w-full px-6 py-3 rounded-xl
          bg-gradient-to-r from-white/90 to-white/80 text-black font-medium text-sm
          flex items-center justify-center gap-2 
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg shadow-white/5
        "
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {children}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      type="submit"
      disabled={loading}
      className="
        relative w-full px-6 py-3 rounded-xl
        bg-gradient-to-r from-white/90 to-white/80 text-black font-medium text-sm
        flex items-center justify-center gap-2 
        hover:from-white hover:to-white/90
        transition-all duration-300 group
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg shadow-white/5
      "
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 group-hover:animate-shimmer" />
      
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </motion.button>
  )
}

const BackButton = ({ onClick }: { onClick: () => void }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-all duration-300 mx-auto mt-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to options
      </button>
    )
  }

  return (
    <motion.button
      whileHover={{ x: -4 }}
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-all duration-300 mx-auto mt-8"
    >
      <ChevronLeft className="w-4 h-4" />
      Back to options
    </motion.button>
  )
}

const PageHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6">
          {icon}
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-white/40 text-sm">{subtitle}</p>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center mb-10"
    >
      <motion.div 
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center justify-center w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6"
      >
        {icon}
      </motion.div>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-white/40 text-sm">{subtitle}</p>
    </motion.div>
  )
}

// =============== PARENT FLOW ===============

function ParentFlow() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const { loginWithGoogle } = useEnhancedAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8 font-sans antialiased">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-600/10 to-gray-800/10 rounded-3xl mb-6 border-2 border-gray-600/20">
            <Shield className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Parent Registration 👨‍👩‍👧
          </h1>
          <p className="text-white/70 text-lg font-medium">
            Secure access to monitor your child's learning journey
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.02] border border-white/[0.1] rounded-3xl p-10 shadow-xl shadow-white/[0.05]">
          <form onSubmit={handleParent} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="email" className="block text-lg font-bold text-white/90">
                Email Address 📧
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className={`
                    w-full pl-12 pr-4 py-4 rounded-2xl 
                    bg-white/[0.05] border-2 ${errors.email ? 'border-red-500/70' : 'border-white/[0.15]'}
                    text-white placeholder-white/40 text-base
                    focus:outline-none focus:border-gray-500 focus:bg-white/[0.08]
                    transition-all duration-300
                  `}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-2xl font-bold text-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1 disabled:opacity-50 min-h-14"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                  Sending Magic Link...
                </span>
              ) : (
                "Send Magic Link ✨"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/40">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-gray-600/20 to-gray-800/20 border-2 border-gray-600/30 
                       text-white font-bold text-lg
                       hover:from-gray-700/30 hover:to-gray-900/30 transition-all duration-300 shadow-xl shadow-gray-500/15 hover:shadow-gray-600/25 hover:-translate-y-1 disabled:opacity-50 min-h-14"
            >
              Sign up with Google
            </button>

            <div className="text-center pt-4">
              <p className="text-xs text-white/40">
                We'll send you a secure login link to access your dashboard
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={() => router.push("/register")}
            className="text-white/50 hover:text-white/70 transition-colors text-sm flex items-center justify-center gap-1 mx-auto"
          >
            <ChevronLeft className="w-3 h-3" />
            Back to options
          </button>
        </div>
      </div>
    </div>
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
          <div className="absolute inset-0 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/30 text-sm">Loading registration form...</p>
      </motion.div>
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