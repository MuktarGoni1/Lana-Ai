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
    },
    {
      id: 'child',
      icon: GraduationCap,
      title: "Student",
      description: "Start your personalized learning adventure",
      path: "/register/form?role=child",
      features: ["Interactive lessons", "AI tutor", "Fun challenges"]
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main content */}
      <div className="flex items-center justify-center px-4 py-12 min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Welcome to Your Journey
            </h1>
            <p className="text-lg text-white/40 max-w-md mx-auto">
              Choose your role to get started with a personalized experience
            </p>
          </div>

          {/* Role selection cards */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {roles.map((role) => {
              const Icon = role.icon

              
              return (
                <button
                  key={role.id}
                  onClick={() => handleNavigation(role.id, role.path)}
                  disabled={isNavigating}
                  className={`
                    relative group p-8 rounded-2xl
                    bg-white/[0.02] backdrop-blur-sm
                    border border-white/[0.05]
                    transition-all duration-300
                    hover:bg-white/[0.04] hover:border-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-left
                  `}
                >
                  {/* Icon container */}
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:bg-white/[0.08] transition-colors">
                    <Icon className="w-7 h-7 text-white/70" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-medium text-white">
                      I&apos;m a {role.title}
                    </h3>
                    <p className="text-white/40 text-sm">
                      {role.description}
                    </p>

                    {/* Features list */}
                    <ul className="space-y-1.5 pt-2">
                      {role.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-white/30">
                          <span className="w-1 h-1 bg-white/20 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Arrow indicator */}
                    <div className="flex items-center pt-3 text-white/40 group-hover:text-white/60 transition-colors">
                      <span className="text-sm">Get started</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Login link */}
          <div className="text-center">
            <button 
              onClick={() => handleNavigation("login", "/login")}
              disabled={isNavigating}
              className="group inline-flex items-center text-white/30 hover:text-white/50 transition-colors duration-200"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              <span>Already have an account?</span>
              <span className="ml-1 font-medium">
                Sign in
              </span>
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