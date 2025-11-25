"use client"

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
      const redirectTo = isClient 
        ? `${window.location.origin}/auth/auto-login`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/auto-login`

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

      router.push(`/register/magic-link-sent?email=${encodeURIComponent(email)}`)
    } catch (error) {
      console.error("Parent registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send magic link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <PageHeader
          icon={<Shield className="w-8 h-8 text-white/80" />}
          title="Parent Registration"
          subtitle="Secure access to monitor your child's progress"
        />

        <GlassCard className="p-8">
          <form onSubmit={handleParent} className="space-y-6">
            <FormInput
              id="email"
              type="email"
              icon={Mail}
              label="Email Address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              error={errors.email}
              required
            />

            <div className="pt-2">
              <SubmitButton loading={isLoading} loadingText="Sending magic link...">
                Send Magic Link
              </SubmitButton>
            </div>

            {/* Google Sign Up Button */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
                       text-white font-medium text-sm
                       hover:bg-white/[0.1] transition-all duration-200
                       flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Chrome className="h-4 w-4" />
              Sign up with Google
            </button>

            {/* Additional info */}
            <div className="pt-4 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-white/30 mt-0.5" />
                <p className="text-xs text-white/30">
                  We'll send you a secure login link to access your dashboard
                </p>
              </div>
            </div>
          </form>
        </GlassCard>

        <BackButton onClick={() => router.push("/register")} />
      </div>
    </div>
  )
}

// =============== CHILD FLOW ===============

function ChildFlow() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    childEmail: "",
    guardianEmail: "",
    nickname: "",
    age: "" as number | "",
    grade: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const authService = new AuthService()
  const { loginWithGoogle } = useEnhancedAuth()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!z.string().email().safeParse(formData.childEmail).success) {
      newErrors.childEmail = "Invalid email format"
    }
    if (!z.string().email().safeParse(formData.guardianEmail).success) {
      newErrors.guardianEmail = "Invalid parent email"
    }
    if (!formData.nickname || formData.nickname.length < 2) {
      newErrors.nickname = "Nickname must be at least 2 characters"
    }
    if (!formData.age || formData.age < 6 || formData.age > 18) {
      newErrors.age = "Age must be between 6 and 18"
    }
    if (!formData.grade) {
      newErrors.grade = "Please select a grade"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value === '' ? '' : Number(value)) : value
    }))
    // Clear error for this field when user types
    setErrors(prev => ({ ...prev, [name]: "" }))
  }

  const handleChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await authService.registerChild(
        formData.nickname, 
        Number(formData.age), 
        formData.grade, 
        formData.guardianEmail
      )
      router.push("/onboarding")
    } catch (error) {
      console.error("Child registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
      console.error("Child Google registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate Google registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <PageHeader
          icon={<GraduationCap className="w-8 h-8 text-white/80" />}
          title="Student Registration"
          subtitle="Begin your personalized learning adventure"
        />

        <GlassCard className="p-8">
          <form onSubmit={handleChild} className="space-y-5">
            <FormInput
              id="childEmail"
              name="childEmail"
              type="email"
              icon={Mail}
              label="Your Email"
              value={formData.childEmail}
              onChange={handleInputChange}
              placeholder="student@example.com"
              error={errors.childEmail}
              required
            />

            <FormInput
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              icon={Shield}
              label="Parent/Guardian Email"
              value={formData.guardianEmail}
              onChange={handleInputChange}
              placeholder="parent@example.com"
              error={errors.guardianEmail}
              required
            />

            <FormInput
              id="nickname"
              name="nickname"
              type="text"
              icon={User}
              label="Nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="How should we call you?"
              error={errors.nickname}
              required
            />

            <FormInput
              id="age"
              name="age"
              type="number"
              min="6"
              max="18"
              icon={Calendar}
              label="Age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="14"
              error={errors.age}
              required
            />

            <FormSelect
              id="grade"
              name="grade"
              icon={GraduationCap}
              label="Grade Level"
              value={formData.grade}
              onChange={handleInputChange}
              error={errors.grade}
              required
            >
              <option value="">Select your grade</option>
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
              <option value="college">College</option>
            </FormSelect>

            <div className="pt-2">
              <SubmitButton loading={isLoading} loadingText="Creating account...">
                Create Account
              </SubmitButton>
            </div>

            {/* Google Sign Up Button */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
                       text-white font-medium text-sm
                       hover:bg-white/[0.1] transition-all duration-200
                       flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Chrome className="h-4 w-4" />
              Sign up with Google
            </button>
          </form>
        </GlassCard>

        <BackButton onClick={() => router.push("/register")} />
      </div>
    </div>
  )
}

// =============== MAIN COMPONENT ===============

function RegisterFormContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role")

  return (
    <AnimatePresence mode="wait">
      {role === "parent" && <ParentFlow key="parent" />}
      {role === "child" && <ChildFlow key="child" />}
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