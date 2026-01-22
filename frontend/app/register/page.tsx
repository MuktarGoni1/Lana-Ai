"use client"
import { useRouter } from "next/navigation"
import { Suspense, useState } from "react"
import { UserCircle, Users, ArrowRight, GraduationCap } from "lucide-react"

function RegisterLandingContent() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavigation = async (role: string, path: string) => {
    setIsNavigating(true)
    // Remove authentication gate for child registration
    // Child registration should be accessible without prior authentication
    router.push(path)
  }

  const roles = [
    {
      id: 'parent',
      icon: Users,
      title: "Parent / Guardian",
      description: "Monitor progress, manage learning journey",
      path: "/register/form?role=parent",
      features: ["Progress reports", "Learning insights", "Account management"]
    }
  ]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7 text-white/70" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Welcome to LanaMind!</h1>
              <p className="text-white/40 text-sm">Choose your role to get started</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleNavigation('parent', '/register/form?role=parent')}
              disabled={isNavigating}
              className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
                       text-white font-medium text-sm
                       hover:bg-white/[0.1] transition-all duration-200
                       flex items-center justify-center gap-3"
            >
              <Users className="h-4 w-4" />
              Register as Parent
            </button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>
            
            <button
              onClick={() => handleNavigation('login', '/login')}
              disabled={isNavigating}
              className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                       hover:bg-white/90 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function RegisterLanding() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterLandingContent />
    </Suspense>
  )
}