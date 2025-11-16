"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/db"
import { ArrowRight, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"

function ParentFlow() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const valid = z.string().email().safeParse(email.trim())
      if (!valid.success) {
        toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" })
        setIsLoading(false)
        return
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirmed/guardian`,
          data: { role: "guardian" }
        }
      })

      if (error) throw error

      // Insert/Upsert guardian record for authenticated users tracking
      const { error: upsertError } = await supabase.from("guardians").upsert({
        email: email.trim(),
        weekly_report: true,
        monthly_report: false,
      }, { onConflict: 'email' })
      if (upsertError) {
        console.warn('[Register Parent] Failed to upsert guardian record:', upsertError)
      }

      // Navigate to magic link sent page with email
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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Parent Registration</h1>
          <p className="text-white/60">Register to manage your child&apos;s learning journey</p>
        </div>

        <form onSubmit={handleParent} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                       text-white placeholder-white/20 text-sm
                       focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                       transition-all duration-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                     flex items-center justify-center gap-2 
                     hover:bg-white/90
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                Send Magic Link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/register")}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors duration-200 mx-auto mt-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to options
        </button>
      </div>
    </div>
  )
}

function ChildFlow() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    childEmail: "",
    guardianEmail: "",
    nickname: "",
    age: "" as number | "",
    grade: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value === '' ? '' : Number(value)) : value
    }))
  }

  const handleChild = async (e: React.FormEvent) => {
    e.preventDefault()
    const { nickname, age, grade, childEmail, guardianEmail } = formData

    if (!childEmail || !guardianEmail || !nickname || !age || !grade) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const child_uid = crypto.randomUUID()
      const password = crypto.randomUUID()

      const { error: signUpError } = await supabase.auth.signUp({
        email: childEmail,
        password,
        options: {
          data: { role: "child", nickname, age, grade, guardian_email: guardianEmail },
          emailRedirectTo: `${window.location.origin}/auth/confirmed/child`
        }
      })
      if (signUpError) throw signUpError

      const { error: insertError } = await supabase.from("users").insert({
        id: child_uid,
        email: childEmail,
        user_metadata: {
          role: "child",
          nickname,
          age,
          grade,
          guardian_email: guardianEmail
        }
      })
      if (insertError) {
        console.warn('[ChildFlow] Failed to create user record:', insertError)
      }

      localStorage.setItem('lana_sid', child_uid)
      router.push("/homepage")
    } catch (error) {
      console.error("Child registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Student Registration</h1>
          <p className="text-white/60">Start your learning journey</p>
        </div>

        <form onSubmit={handleChild} className="space-y-4">
          <div>
            <label htmlFor="childEmail" className="block text-sm font-medium mb-2">
              Your Email
            </label>
            <input
              id="childEmail"
              name="childEmail"
              type="email"
              value={formData.childEmail}
              onChange={handleInputChange}
              placeholder="student@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                       text-white placeholder-white/20 text-sm
                       focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                       transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="guardianEmail" className="block text-sm font-medium mb-2">
              Parent/Guardian Email
            </label>
            <input
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              value={formData.guardianEmail}
              onChange={handleInputChange}
              placeholder="parent@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                       text-white placeholder-white/20 text-sm
                       focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                       transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium mb-2">
              Nickname
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="How should we call you?"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                       text-white placeholder-white/20 text-sm
                       focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                       transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium mb-2">
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min="6"
              max="18"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="14"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                       text-white placeholder-white/20 text-sm
                       focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                       transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium mb-2">
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                       text-white text-sm
                       focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                       transition-all duration-200
                       [&>option]:bg-black [&>option]:text-white"
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
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                     flex items-center justify-center gap-2 
                     hover:bg-white/90
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/register")}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors duration-200 mx-auto mt-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to options
        </button>
      </div>
    </div>
  )
}

function RegisterFormContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") // "parent" or "child"

  if (role === "parent") return <ParentFlow />
  if (role === "child") return <ChildFlow />
  return null
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading registration form…</p>
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