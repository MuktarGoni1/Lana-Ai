"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [nickname, setNickname] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [grade, setGrade] = useState("")

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

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return router.push("/login")
    }

    const child_uid = crypto.randomUUID() // anon child

    try {
      // 1. create child user (anon)
      const { error: userErr } = await supabase.from("users").insert({
        id: child_uid,
        email: `${child_uid}@child.lana`,
        user_metadata: { role: "child", nickname, age, grade },
      })
      if (userErr) throw userErr

      // 2. link parent → child
      const { error: guardianErr } = await supabase.from("guardians").insert({
        email: session.user.email,
        child_uid,
        weekly_report: true,
        monthly_report: false,
      })
      if (guardianErr) {
        // Compensate: remove child user to avoid orphaned record
        await supabase.from("users").delete().eq("id", child_uid)
        throw guardianErr
      }

      toast({ title: "Success", description: "Child linked to your account." })
      router.push("/term-plan?onboarding=1")
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to set up child.",
        variant: "destructive",
      })
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
              <svg
                className="w-8 h-8 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
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
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter child's nickname"
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.03] transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label 
                htmlFor="age" 
                className="block text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Age
              </label>
              <input
                id="age"
                type="number"
                min={6}
                max={18}
                value={age || ""}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                placeholder="Age"
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.03] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="grade" 
                className="block text-xs font-medium text-white/40 uppercase tracking-wider"
              >
                Grade
              </label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 focus:bg-white/[0.03] transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff40' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
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
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-5 py-3.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-white/95 transition-all duration-200"
            >
              Finish setup
            </button>
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