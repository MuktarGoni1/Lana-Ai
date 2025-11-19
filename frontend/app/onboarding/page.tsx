"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, BookOpen, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InsertUser, InsertGuardian } from "@/types/supabase"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [nickname, setNickname] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [grade, setGrade] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname || !age || !grade) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication error",
          description: "Please log in again",
          variant: "destructive",
        })
        return router.push("/login")
      }

      const child_uid = crypto.randomUUID() // anon child

      // 1. create child user (anon) - handle case where users table doesn't exist
      let userCreated = false;
      try {
        const userData: InsertUser = {
          id: child_uid,
          email: `${child_uid}@child.lana`,
          user_metadata: { role: "child", nickname, age, grade },
        };
        
        // Cast to any to bypass TypeScript error with Supabase client typing
        const { error: userErr } = await (supabase.from("users").insert([userData] as any));
        if (userErr) {
          console.debug('[Onboarding] users table insert error:', userErr);
        } else {
          userCreated = true;
        }
      } catch (tableError) {
        // If the users table doesn't exist, that's okay
        console.debug('[Onboarding] users table may not exist:', tableError);
      }

      // 2. link parent → child
      try {
        const guardianData: InsertGuardian = {
          email: session.user.email || "",
          child_uid,
          weekly_report: true,
          monthly_report: false,
        };
        
        // Cast to any to bypass TypeScript error with Supabase client typing
        const { error: guardianErr } = await (supabase.from("guardians").insert([guardianData] as any));
        if (guardianErr) {
          // Compensate: remove child user to avoid orphaned record (if it was created)
          if (userCreated) {
            try {
              await (supabase.from("users").delete().eq("id", child_uid) as any);
            } catch (deleteError) {
              console.debug('[Onboarding] Failed to cleanup child user:', deleteError);
            }
          }
          throw guardianErr
        }
      } catch (guardianError) {
        throw guardianError;
      }

      toast({ 
        title: "Success", 
        description: "Child linked to your account successfully!" 
      })
      router.push("/guardian")
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to set up child.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter child's nickname"
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.03] transition-all pl-10"
                required
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
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
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Age"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.03] transition-all pl-10"
                  required
                />
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
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
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.03] transition-all appearance-none cursor-pointer pl-10 pr-8"
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
            </div>
          </div>

          <div className="pt-4">
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
          </div>
        </form>

        {/* Back button */}
        <div className="pt-6">
          <button
            onClick={() => router.push("/guardian")}
            className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-2 mx-auto"
          >
            Back to dashboard
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-8">
          You can add more children later from settings
        </p>
      </div>
    </div>
  )
}