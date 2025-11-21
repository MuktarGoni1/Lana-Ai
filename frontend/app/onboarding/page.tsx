"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, BookOpen, GraduationCap, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InsertUser, InsertGuardian } from "@/types/supabase"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [nickname, setNickname] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [grade, setGrade] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    nickname: "",
    age: "",
    grade: ""
  })

  // Validation functions
  const validateNickname = (value: string) => {
    if (!value.trim()) return "Nickname is required"
    if (value.trim().length < 2) return "Nickname must be at least 2 characters"
    return ""
  }

  const validateAge = (value: number | "") => {
    if (value === "") return "Age is required"
    if (typeof value === "number" && (value < 6 || value > 18)) return "Age must be between 6 and 18"
    return ""
  }

  const validateGrade = (value: string) => {
    if (!value) return "Grade is required"
    return ""
  }

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    setErrors(prev => ({ ...prev, nickname: validateNickname(value) }))
  }

  const handleAgeChange = (value: string) => {
    const numValue = value === "" ? "" : Number(value)
    setAge(numValue)
    setErrors(prev => ({ ...prev, age: validateAge(numValue) }))
  }

  const handleGradeChange = (value: string) => {
    setGrade(value)
    setErrors(prev => ({ ...prev, grade: validateGrade(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Onboarding] Starting child registration process');
    console.log('[Onboarding] Form data:', { nickname, age, grade });
    
    // Validate all fields
    const nicknameError = validateNickname(nickname)
    const ageError = validateAge(age)
    const gradeError = validateGrade(grade)
    
    setErrors({
      nickname: nicknameError,
      age: ageError,
      grade: gradeError
    })
    
    if (nicknameError || ageError || gradeError) {
      console.warn('[Onboarding] Validation failed:', { nicknameError, ageError, gradeError });
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log('[Onboarding] Getting user session');
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[Onboarding] Session status:', session ? 'Active' : 'None');
      
      if (!session) {
        console.error('[Onboarding] No session found, redirecting to login');
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue with child registration.",
          variant: "destructive",
        })
        return router.push("/login")
      }

      // Call the proper API route to register the child
      console.log('[Onboarding] Calling register-child API');
      const response = await fetch('/api/auth/register-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childEmail: `${crypto.randomUUID()}@child.lana`,
          guardianEmail: session.user.email,
          nickname,
          age: Number(age),
          grade
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('[Onboarding] API registration failed:', result.message);
        toast({
          title: "Registration Failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({ 
        title: "Success", 
        description: "Child successfully linked to your account! Redirecting to complete setup..." 
      })
      // Redirect to term-plan to complete onboarding
      console.log('[Onboarding] Redirecting to term-plan');
      router.push("/term-plan?onboarding=1")
    } catch (err: unknown) {
      console.error('[Onboarding] Unexpected error:', err);
      console.error('[Onboarding] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      toast({
        title: "Registration Error",
        description: err instanceof Error ? err.message : "Failed to complete child registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    router.push("/guardian")
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-8 h-2 bg-white/80 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
            <div className="relative w-16 h-16 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white/80" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-light tracking-tight">
            Set up your child
          </h1>
          <p className="text-white/50 text-sm">
            This helps Lana explain at the right level
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="nickname" 
              className="block text-xs font-medium text-white/40 uppercase tracking-wider"
            >
              Nickname
            </label>
            <div className="relative">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Enter child's nickname"
                className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.03] transition-all pl-10 ${
                  errors.nickname ? "border-red-500" : "border-white/10 focus:border-white/30"
                }`}
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
            {errors.nickname && (
              <p className="text-red-400 text-xs mt-1">{errors.nickname}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label 
                htmlFor="age" 
                className="block text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Age
              </label>
              <div className="relative">
                <input
                  id="age"
                  type="number"
                  min={6}
                  max={18}
                  value={age || ""}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  placeholder="Age"
                  className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.03] transition-all pl-10 ${
                    errors.age ? "border-red-500" : "border-white/10 focus:border-white/30"
                  }`}
                  required
                />
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              {errors.age && (
                <p className="text-red-400 text-xs mt-1">{errors.age}</p>
              )}
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="grade" 
                className="block text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Grade
              </label>
              <div className="relative">
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white focus:outline-none focus:bg-white/[0.03] transition-all appearance-none cursor-pointer pl-10 pr-8 ${
                    errors.grade ? "border-red-500" : "border-white/10 focus:border-white/30"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff40' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                  required
                >
                  <option value="" disabled className="bg-black text-white/50">
                    Select
                  </option>
                  <option value="6" className="bg-black">Grade 6</option>
                  <option value="7" className="bg-black">Grade 7</option>
                  <option value="8" className="bg-black">Grade 8</option>
                  <option value="9" className="bg-black">Grade 9</option>
                  <option value="10" className="bg-black">Grade 10</option>
                  <option value="11" className="bg-black">Grade 11</option>
                  <option value="12" className="bg-black">Grade 12</option>
                  <option value="college" className="bg-black">College</option>
                </select>
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
              {errors.grade && (
                <p className="text-red-400 text-xs mt-1">{errors.grade}</p>
              )}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              className="w-full px-5 py-3.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/95 transition-all duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Finish setup"
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full px-5 py-3.5 border border-white/20 text-white font-medium text-sm rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
          </div>
        </form>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-8">
          You can add more children later from settings
        </p>
      </div>
    </div>
  )
}