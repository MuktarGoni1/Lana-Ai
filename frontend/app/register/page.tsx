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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 font-sans antialiased">
      <div className="w-full max-w-md text-center space-y-8 py-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Welcome to LanaMind! 🌟
          </h1>
          <p className="text-white/70 text-lg font-medium">
            Choose your role to get started
          </p>
        </div>

        {/* Role selection card */}
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <div 
              key={role.id}
              className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.02] border border-white/[0.1] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10"
            >
              <div className="flex flex-col items-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-600/10 to-gray-800/10 flex items-center justify-center border-2 border-gray-600/20">
                  <Icon className="w-10 h-10 text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">
                    {role.title} 👨‍👩‍👧
                  </h3>
                  <p className="text-white/70 text-base font-medium">
                    {role.description}
                  </p>
                  
                  <ul className="space-y-1 pt-2">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-white/60">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  onClick={() => handleNavigation(role.id, role.path)}
                  disabled={isNavigating}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-2xl font-bold text-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1 disabled:opacity-50 min-h-14"
                >
                  {isNavigating ? 'Loading...' : 'Continue →'}
                </button>
              </div>
            </div>
          )
        })}

        {/* Login link */}
        <div className="pt-6">
          <button 
            onClick={() => handleNavigation("login", "/login")}
            disabled={isNavigating}
            className="text-white/70 hover:text-white transition-colors text-lg font-medium inline-flex items-center gap-2"
          >
            Already have an account? <span className="text-blue-400 font-bold">Sign in</span> →
          </button>
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