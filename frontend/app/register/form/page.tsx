"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Check, Mail, User, ChevronLeft } from "lucide-react"
import { Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { AuthService } from "@/lib/services/authService"

function RegisterFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const authService = new AuthService()
  const role = searchParams.get("role") // "parent" or "child"

  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  /* ---- PARENT FLOW ---- */
  if (role === "parent") {
    const [email, setEmail] = useState("")

    const handleParent = async () => {
      if (!email.trim()) {
        toast({
          title: "Error",
          description: "Parent e-mail is required",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        await authService.registerParent(email);
        setSent(true);
      } catch { // eslint-disable-line @typescript-eslint/no-unused-vars
        toast({
          title: "Error",
          description: "Failed to register. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (sent)
      return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8">
              <div className="text-center space-y-6">
                <div className="bg-white/[0.05] w-14 h-14 rounded-xl flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 text-white/70" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-white">
                    Check your inbox
                  </h1>
                  <p className="text-white/40 text-sm">
                    We&apos;ve sent a magic link to
                  </p>
                  <p className="text-white/70 font-medium">
                    {email}
                  </p>
                </div>
                
                <button 
                  onClick={() => setSent(false)} 
                  className="text-sm text-white/30 hover:text-white/50 transition-colors duration-200"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8">
              <form onSubmit={handleParent} className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/[0.05] p-2.5 rounded-xl">
                      <Mail className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-white">
                        Parent Registration
                      </h1>
                      <p className="text-white/30 text-xs">
                        Secure access for guardians
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-white/40 text-sm">
                    No password needed. We&apos;ll send a secure magic link to your email.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@email.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                             text-white placeholder-white/20 text-sm
                             focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                             transition-all duration-200"
                    required
                  />

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full px-6 py-3.5 rounded-xl 
                             bg-white text-black font-medium text-sm
                             flex items-center justify-center gap-2 
                             hover:bg-white/90
                             transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Magic Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => router.push("/register")} 
                  className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors duration-200 mx-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to options
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ---- CHILD FLOW ---- */
  const [nickname, setNickname] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [grade, setGrade] = useState("")

  const handleChild = async () => {
    if (!nickname || !age || !grade) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.registerChild(nickname, Number(age), grade);
      router.push("/onboarding"); // child can add parent later
    } catch {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8">
            <form onSubmit={handleChild} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white/[0.05] p-2.5 rounded-xl">
                    <User className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-white">
                      Student Registration
                    </h1>
                    <p className="text-white/30 text-xs">
                      Start your learning journey
                    </p>
                  </div>
                </div>
                
                <p className="text-white/40 text-sm">
                  Create your account in seconds. No email required.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                           text-white placeholder-white/20 text-sm
                           focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                           transition-all duration-200"
                  required
                />

                <input
                  type="number"
                  min="6"
                  max="18"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  placeholder="Your age"
                  className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                           text-white placeholder-white/20 text-sm
                           focus:outline-none focus:border-white/10 focus:bg-white/[0.05]
                           transition-all duration-200"
                  required
                />

                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] 
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

                <button 
                  type="submit"
                  disabled={isLoading} 
                  className="w-full px-6 py-3.5 rounded-xl 
                           bg-white text-black font-medium text-sm
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
              </div>

              <button 
                type="button" 
                onClick={() => router.push("/register")} 
                className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors duration-200 mx-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to options
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterForm() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
            <p className="text-white/30 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  )
}