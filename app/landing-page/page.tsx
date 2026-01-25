"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { createCheckoutSession } from "@/services/paymentService"
import {
CheckCircle2,
ArrowRight,
Menu,
X,
Moon,
Sun,
Twitter,
Facebook,
Instagram,
Linkedin,
GraduationCap,
Lightbulb,
BarChart3,
Bot,
Zap,
Calendar,
BookOpen,
Calculator,
MoreHorizontal,
Star,
Sparkles,
Trophy,
Heart,
Mail,
MessageCircle,
} from "lucide-react"

/* ---------- CONFIG ---------- */

/* ---------- STYLING UTILS ---------- */
const getChildFriendlyClasses = {
  card: "rounded-3xl border-2 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
  button: "rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
  buttonSecondary: "rounded-full bg-white text-blue-600 font-bold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-blue-200",
  buttonSmall: "rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
  input: "rounded-2xl border-2 border-blue-200 bg-white p-4 text-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent",
  header: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white",
  section: "py-12 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50",
  hero: "py-12 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100",
};

const getRandomBounce = () => Math.floor(Math.random() * 40) - 20;
const FEATURES = [
"Personalised and Adaptive lessons tailored to your age and learning pace",
"Real-time progress reports for parents",
"Crystal-clear explanations by Lana AI",
"Personalized learning avatar",
"structured learning paths",
] as const

const PLANS = {
monthly: [
{ name: "Free", price: 0, desc: "Perfect for individual learners", feats: ["Unlimited lessons", "Adaptive AI", "Progress tracking", "Mobile & desktop"] },
{ name: "Family", price: 19, desc: "Connect parent and student", popular: true, feats: ["Up to 2 students", "Parent dashboard", "Real-time reports", "Push notifications"] },
{ name: "Family Plus", price: 29, desc: "For larger families", feats: ["Up to 5 students", "Advanced analytics", "Weekly summaries", "Priority support"] },
],
yearly: [
{ name: "Free", price: 0, desc: "Perfect for individual learners", feats: ["Unlimited lessons", "Adaptive AI", "Progress tracking", "Mobile & desktop"] },
{ name: "Family", price: 17, desc: "Connect parent and student", popular: true, feats: ["Up to 2 students", "Parent dashboard", "Real-time reports", "Push notifications"] },
{ name: "Family Plus", price: 25, desc: "For larger families", feats: ["Up to 5 students", "Advanced analytics", "Weekly summaries", "Priority support"] },
],
} as const

/* ---------- THEME TOGGLE ---------- */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  // Show placeholder to prevent layout shift before mount
  if (!mounted) {
    return (
      <div className="inline-flex items-center justify-center rounded-full w-12 h-12" />
    )
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-full w-12 h-12 bg-gradient-to-r from-yellow-300 to-orange-400 hover:from-yellow-200 hover:to-orange-300 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background transform hover:scale-110 min-h-12 min-w-12"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={resolvedTheme === "dark"}
    >
      {resolvedTheme === "dark" ? (
        <Moon className="h-6 w-6 text-blue-800" aria-hidden="true" />
      ) : (
        <Sun className="h-6 w-6 text-yellow-600" aria-hidden="true" />
      )}
    </button>
  )
}

/* ---------- HEADER ---------- */
function Header() {
  const [open, setOpen] = useState(false)
  const { user } = useUnifiedAuth()

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl xs:text-2xl font-bold text-black">LanaMind</span>
          </div>

          {/* desktop */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {['Features', 'Pricing', 'Contact'].map((l) => (
              <Link 
                key={l} 
                href={
                  l === 'Features' ? '/features' :
                  l === 'Pricing' ? '/pricing' :
                  '#contact'} // Keep contact as anchor since it's on same page
                className="text-sm font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-3 py-2 hover:bg-white/20 transform hover:scale-105"
              >
                {l}
              </Link>
            ))}
            <Link 
              href="/term-plan" 
              className="text-sm font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-3 py-2 hover:bg-white/20 transform hover:scale-105"
            >
              Term Plan
            </Link>
            <Link 
              href="/feedback" 
              className="text-sm font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-3 py-2 hover:bg-white/20 transform hover:scale-105"
            >
              Feedback
            </Link>
            <Link 
              href="/settings" 
              className="text-sm font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-3 py-2 hover:bg-white/20 transform hover:scale-105"
            >
              Settings
            </Link>
            <ThemeToggle />
            {user ? (
              <Link 
                href="/homepage" 
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 text-gray-800 font-bold px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-h-12 min-w-32"
              >
                <Trophy className="h-4 w-4" />
                My Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-3 py-2 hover:bg-white/20 transform hover:scale-105"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 text-gray-800 font-bold px-5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-h-12 min-w-32"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* mobile burger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 min-h-12 min-w-12 flex items-center justify-center"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>

        {/* mobile panel */}
        <div
          id="mobile-nav"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100 bg-gradient-to-b from-blue-500 to-purple-500 rounded-xl p-4" : "max-h-0 opacity-0"}`}
        >
          <nav className="flex flex-col gap-2 py-3 xs:py-4">
            {['Features', 'Pricing', 'Contact'].map((l) => (
              <Link 
                key={l} 
                href={
                  l === 'Features' ? '/features' :
                  l === 'Pricing' ? '/pricing' :
                  '#contact'} // Keep contact as anchor since it's on same page
                onClick={() => setOpen(false)} 
                className="text-base font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-4 py-3 hover:bg-white/20 transform hover:scale-105"
              >
                {l}
              </Link>
            ))}
            <Link 
              href="/term-plan" 
              onClick={() => setOpen(false)} 
              className="text-base font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-4 py-3 hover:bg-white/20 transform hover:scale-105"
            >
              Term Plan
            </Link>
            <Link 
              href="/feedback" 
              onClick={() => setOpen(false)} 
              className="text-base font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-4 py-3 hover:bg-white/20 transform hover:scale-105"
            >
              Feedback
            </Link>
            <Link 
              href="/settings" 
              onClick={() => setOpen(false)} 
              className="text-base font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-4 py-3 hover:bg-white/20 transform hover:scale-105"
            >
              Settings
            </Link>
            <div className="mt-4 pt-4 border-t border-white/30">
              <div className="flex items-center justify-center gap-3 pb-3 px-3">
                <ThemeToggle />
                <span className="text-sm text-white">Theme</span>
              </div>
              {user ? (
                <Link 
                  href="/homepage" 
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 text-gray-800 font-bold px-4 py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 w-full min-h-12"
                  onClick={() => setOpen(false)}
                >
                  <Trophy className="h-4 w-4" />
                  My Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-base font-bold text-white hover:text-yellow-200 transition-all duration-300 ease-in-out rounded-lg px-4 py-3 hover:bg-white/20 transform hover:scale-105 w-full text-center"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 text-gray-800 font-bold px-4 py-3 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 w-full min-h-12 mt-3"
                    onClick={() => setOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

/* ---------- HERO ---------- */
function HeroSection() {
  const { user } = useUnifiedAuth()
  const [isMuted, setIsMuted] = useState(true)

  const toggleAudio = () => {
    setIsMuted(prev => !prev)
  }

  return (
    <section id="hero" className="py-8 sm:py-12 md:py-20 lg:py-32 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-6 w-6 text-yellow-500 animate-bounce" />
              <span className="text-lg font-bold text-blue-600">Learning Made clear!</span>
              <Star className="h-6 w-6 text-yellow-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              {user ? `Welcome back, ${user.email?.split('@')[0] || user.user_metadata?.full_name || 'learner'}!` : "Your AI-powered afterclass tutor!"}
            </h1>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
              {user 
                ? "Continue your personalized learning journey with adaptive AI tutoring."
                : "Learn with our AI tutor that provides clear, age-appropriate explanations for every concept."
              }
            </p>
            {!user && (
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed italic bg-blue-50 p-4 rounded-2xl">
                <Heart className="h-5 w-5 text-red-400 inline mr-1" /> Transforming education through AI-powered clarity. Lana breaks down complex school topics into clear, digestible lessons tailored for young learners.
              </p>
            )}
            <div className="flex flex-col xs:flex-row gap-3 w-full">
              {user ? (
                <Link 
                  href="/homepage" 
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-h-14 flex-1"
                >
                  <Trophy className="h-5 w-5" />
                  Continue Learning
                </Link>
              ) : (
                <>
                  <Link 
                    href="/register" 
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-h-14 flex-1"
                  >
                    <Star className="h-5 w-5" />
                    Start Learning
                  </Link>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-h-14 flex-1"
                  >
                    <Sparkles className="h-5 w-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>
            {!user && (
              <p className="text-sm xs:text-base text-gray-600 leading-relaxed">
                Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded">Sign in</Link> to continue your learning journey.
              </p>
            )}
            <div className="pt-4 space-y-3">
              <h3 className="font-bold text-lg text-blue-700 flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-500" /> Key Features:</h3>
              <ul className="space-y-3">
                {FEATURES.map((f, index) => (
                  <li key={f} className="flex items-start gap-3 text-sm xs:text-base text-gray-700 p-3 bg-white/70 rounded-xl shadow-sm">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative h-64 xs:h-72 sm:h-80 md:h-96 lg:h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-105 transition-transform duration-500">
            <video 
              src="/landing.mp4" 
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="object-cover w-full h-full"
            />
            {/* Audio indicator */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-300 to-orange-400 backdrop-blur-sm rounded-full p-3 shadow-lg border-2 border-white/50 transition-all duration-300 hover:scale-110 cursor-pointer" onClick={toggleAudio}>
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-md animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12" />
                </svg>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- FEATURES ---------- */
function FeaturesSection() {
  const features = [
    { title: "Structured learning paths", desc: "Organized lesson sequences that build knowledge progressively.", icon: Calendar },
    { title: "Clear explanations", desc: "Step-by-step guidance that makes complex topics accessible.", icon: BookOpen },
    { title: "Math assistance", desc: "Interactive support for mathematical concepts with visual aids.", icon: Calculator },
    { title: "Instant clarification", desc: "Immediate answers to questions with detailed explanations.", icon: Zap },
    { title: "Additional tools", desc: "Supplementary learning resources for enhanced understanding.", icon: Sparkles },
  ]
  return (
    <section id="features" className="py-12 xs:py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-7xl px-4 xs:px-6 sm:px-8 lg:px-8">
        {/* Diagnostic Quiz Button at the top */}
        <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <Link 
            href="/diagnostic-quiz"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-5 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 mb-6 xs:mb-7 sm:mb-8 max-w-2xl mx-auto w-full min-h-16"
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                e.preventDefault();
                window.location.href = "/diagnostic-quiz";
              }
            }}
          >
            <Trophy className="h-6 w-6" />
            Take a fun quiz to see how smart you are! See your progress in 30 days!
            <Star className="h-6 w-6" />
          </Link>
        </div>
        
        {/* Core Features Heading and Content */}
        <div className="text-center mb-8 xs:mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <div className="inline-block rounded-full bg-gradient-to-r from-blue-400 to-purple-500 px-6 py-2 mb-4">
            <span className="text-white font-bold text-lg">Core Features</span>
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mt-3 text-gray-800 leading-tight">Everything You Need for Effective Learning</h2>
          <p className="text-gray-600 mt-3 xs:mt-4 max-w-2xl mx-auto text-sm xs:text-base md:text-lg leading-relaxed">
            Lana AI combines advanced AI technology with proven educational methods to create clear, effective learning experiences for children.
          </p>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-6 xs:gap-6 sm:gap-8 md:gap-8 lg:gap-8">
          {features.map((f, index) => (
            <div 
              key={f.title} 
              className="rounded-3xl border-2 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-gray-800 min-h-72 flex flex-col border-pink-200"
              style={{ transform: `rotate(${(index % 2 === 0 ? '' : '-')}${getRandomBounce()}deg)` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mb-4 self-center">
                <f.icon className="text-white h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-blue-700 leading-tight">{f.title}</h3>
              <p className="text-gray-700 text-base leading-relaxed flex-grow text-center">{f.desc}</p>
              <div className="mt-4 flex justify-center">
                <div className="w-12 h-1 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- STRUCTURED LESSONS ---------- */
function StructuredLessonsSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block rounded-full bg-gradient-to-r from-green-400 to-blue-500 px-6 py-2 mb-4">
            <span className="text-white font-bold text-lg">Structured Learning</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-gray-800 leading-tight">Organized Lessons for Better Understanding</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Our systematic approach breaks complex topics into manageable segments for clearer comprehension.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-3xl border-2 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-gray-800 border-yellow-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Progressive Learning</h3>
            <p className="text-gray-700 leading-relaxed">Structured progression ensures solid understanding at each stage.</p>
          </div>
          <div className="text-center p-6 rounded-3xl border-2 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-gray-800 border-pink-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Building Foundations</h3>
            <p className="text-gray-700 leading-relaxed">Each concept reinforces prior knowledge for stronger retention.</p>
          </div>
          <div className="text-center p-6 rounded-3xl border-2 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-gray-800 border-blue-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Interactive Reinforcement</h3>
            <p className="text-gray-700 leading-relaxed">Engaging exercises that strengthen learning at every stage.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PRICING ---------- */
function PricingSection() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")
  const plans = PLANS[interval]
  const periodLabel = interval === "yearly" ? "/mo (billed yearly)" : "/mo"
  
  const handlePlanSelection = async (planName: string) => {
    // Redirect to registration/login if not authenticated
    if (!user) {
      window.location.href = "/register";
      return;
    }
    
    // Prepare payment data
    const selectedPlan = plans.find(p => p.name === planName);
    if (!selectedPlan) return;
    
    try {
      // Create checkout session using payment service
      const paymentData = {
        planName,
        interval,
        billingInfo: {
          firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          address: '',
          city: '',
          country: 'Nigeria',
          postalCode: '',
          cardNumber: '',
          expiryDate: '',
          cvv: ''
        }
      };
      
      const session = await createCheckoutSession(paymentData);
      
      // Redirect to checkout session URL
      if (session.url) {
        window.location.href = session.url;
      } else {
        // Fallback to checkout page
        window.location.href = `/checkout?plan=${planName}&interval=${interval}`;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('There was an error processing your payment. Please try again.');
    }
  };
  
  const { user } = useUnifiedAuth()
  
  return (
    <section id="pricing" className={`${getChildFriendlyClasses.section}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 bg-clip-text text-transparent leading-tight">Clear Learning Plans</h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">Choose the right plan for your educational goals.</p>

          <div className="mt-6 inline-flex rounded-full bg-gradient-to-r from-blue-100 to-purple-100 p-1" role="tablist" aria-label="Billing frequency">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-4 py-3 text-sm rounded-full transition-all duration-300 font-bold ${interval === "monthly" ? "bg-white shadow-lg text-purple-600" : "text-gray-600"} hover:bg-white hover:shadow-lg hover:scale-105 active:scale-95 min-h-12 min-w-28 flex items-center justify-center border-2 ${interval === "monthly" ? "border-purple-300" : "border-transparent"}`}
              aria-pressed={interval === "monthly"}
              role="tab"
              aria-selected={interval === "monthly"}
              tabIndex={interval === "monthly" ? 0 : -1}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-4 py-3 text-sm rounded-full transition-all duration-300 font-bold ${interval === "yearly" ? "bg-white shadow-lg text-purple-600" : "text-gray-600"} hover:bg-white hover:shadow-lg hover:scale-105 active:scale-95 min-h-12 min-w-28 flex items-center justify-center border-2 ${interval === "yearly" ? "border-purple-300" : "border-transparent"}`}
              aria-pressed={interval === "yearly"}
              role="tab"
              aria-selected={interval === "yearly"}
              tabIndex={interval === "yearly" ? 0 : -1}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p, index) => (
            <div
              key={p.name}
              className={`${getChildFriendlyClasses.card} ${"popular" in p && p.popular ? "border-4 border-yellow-400 relative transform scale-105 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50" : ""} hover:rotate-1`}
            >
              {"popular" in p && p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-4 py-1 rounded-full font-bold shadow-lg">
                  🌟 Most Popular
                </div>
              )}
              <div className="space-y-3 mb-5">
                <div className="flex justify-center mb-2">
                  {index === 0 && <Star className="h-8 w-8 text-yellow-400" />}
                  {index === 1 && <Trophy className="h-8 w-8 text-yellow-500" />}
                  {index === 2 && <Heart className="h-8 w-8 text-red-400" />}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-purple-700 leading-tight text-center">{p.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-green-600">${p.price}</span>
                  <span className="text-gray-600 text-sm">{periodLabel}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed text-center font-medium">{p.desc}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePlanSelection(p.name);
                }}
                className={`${getChildFriendlyClasses.buttonSmall} w-full justify-center`}
                aria-label={`Get started with ${p.name} plan`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- CTA ---------- */
function CtaSection() {
  const { user } = useUnifiedAuth()

  return (
    <section id="get-started" className="py-20 md:py-32 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl mx-4 my-16 p-8 md:p-12 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/80 to-purple-600/80"></div>
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <div className="flex justify-center mb-6">
          <Sparkles className="h-16 w-16 text-yellow-300 animate-bounce" />
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
          {user 
            ? "Continue Your Learning Journey" 
            : "Start Your Clear Learning Path Today"
          }
        </h2>
        <p className="text-blue-100 mt-4 max-w-2xl mx-auto text-lg leading-relaxed mb-8 font-medium">
          {user
            ? "Keep progressing with your personalized AI tutor."
            : "Join students who are achieving better understanding through AI-powered learning. Begin your educational journey with clear explanations."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link 
              href="/homepage" 
              className={`${getChildFriendlyClasses.button} inline-flex items-center justify-center gap-2 min-w-64`}
            >
              <Trophy className="h-5 w-5" />
              Continue Learning
              <Star className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link 
                href="/register" 
                className={`${getChildFriendlyClasses.button} inline-flex items-center justify-center gap-2 min-w-64`}
                onClick={(e) => {
                  if (typeof window !== 'undefined') {
                    e.preventDefault();
                    window.location.href = "/register";
                  }
                }}
              >
                <Star className="h-5 w-5" />
                Begin Learning
                <Sparkles className="h-5 w-5" />
              </Link>
              <Link 
                href="/login" 
                className={`${getChildFriendlyClasses.buttonSecondary} inline-flex items-center justify-center gap-2 min-w-64`}
                onClick={(e) => {
                  if (typeof window !== 'undefined') {
                    e.preventDefault();
                    window.location.href = "/login";
                  }
                }}
              >
                <BookOpen className="h-5 w-5" />
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- LANA SECTION ---------- */
function LanaSection() {
  return (
    <section className={`${getChildFriendlyClasses.hero}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 to-orange-100 transform hover:scale-105 transition-transform duration-500">
              <Image 
                src="/Updated Avatar.png" 
                alt="Lana AI - Your Personalized Learning Companion" 
                fill
                className="object-cover object-center p-4 rounded-2xl"
                priority
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg border-2 border-white">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 px-4 py-2 mb-4">
              <Bot className="h-5 w-5 text-white" />
              <span className="text-white font-bold">AI Learning Friend</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">Meet Lana, Your AI Learning Assistant</h2>
            <p className="text-gray-700 text-base md:text-lg mb-6 max-w-2xl leading-relaxed font-medium">
              Lana is your dedicated AI tutor that transforms complex concepts into clear, understandable explanations. Patient and always available, she provides personalized guidance for effective learning.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-gray-700 font-medium">Patient Guidance</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                <span className="text-gray-700 font-medium">Intelligent Support</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-gray-700 font-medium">Reliable Assistance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- EDUCATIONAL APPROACH ---------- */
function EducationalApproachSection() {
  return (
    <section className={`${getChildFriendlyClasses.section}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">How We Enhance Children's Learning</h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Our AI-powered approach delivers clear explanations and structured learning for better educational outcomes.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-auto">
          <div className="lg:w-1/2">
            <div className={`${getChildFriendlyClasses.card} hover:rotate-1`}>
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-3 rounded-2xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Adaptive AI Learning</h3>
                  <p className="text-gray-700 leading-relaxed font-medium">Our AI system adapts to individual learning styles and simplifies complex concepts for better comprehension.</p>
                </div>
              </div>
            </div>
            <div className={`${getChildFriendlyClasses.card} hover:-rotate-1 mt-6`}>
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-2xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Track Your Growth</h3>
                  <p className="text-gray-700 leading-relaxed font-medium">Monitor learning progress through detailed analytics and measurable improvement indicators.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-4 border-pink-300 bg-gradient-to-br from-pink-100 to-purple-100">
              <Image 
                src="/Happy child.jpg" 
                alt="Happy child engaged in learning with Lana AI" 
                width={600}
                height={400}
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- TERM PLANS ---------- */
function TermPlansSection() {
  return (
    <section className={`${getChildFriendlyClasses.hero}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent leading-tight">Comprehensive Learning Programs</h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Our structured programs help students master subjects through progressive, step-by-step learning approaches.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`${getChildFriendlyClasses.card} text-center hover:rotate-2`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Extended Learning Paths</h3>
            <p className="text-gray-700 leading-relaxed font-medium">Comprehensive programs designed for sustained learning over extended periods.</p>
          </div>
          <div className={`${getChildFriendlyClasses.card} text-center hover:-rotate-2`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Progress Recognition</h3>
            <p className="text-gray-700 leading-relaxed font-medium">Celebrate learning achievements through milestone tracking and recognition systems.</p>
          </div>
          <div className={`${getChildFriendlyClasses.card} text-center hover:rotate-2`}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Flexible Progression</h3>
            <p className="text-gray-700 leading-relaxed font-medium">Adjust learning pathways dynamically based on individual progress and needs.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- MATH TUTOR ---------- */
function MathTutorSection() {
  return (
    <section className={`${getChildFriendlyClasses.section}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-purple-500" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">Math Learning Support</h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Struggling with math? Our AI tutor provides detailed, step-by-step guidance for problem-solving.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className={`${getChildFriendlyClasses.card} hover:rotate-1`}>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-3 rounded-2xl">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Detailed Problem Solving</h3>
                <p className="text-gray-700 leading-relaxed font-medium">Master mathematical concepts through comprehensive explanations of each solution step.</p>
              </div>
            </div>
          </div>
          <div className={`${getChildFriendlyClasses.card} hover:-rotate-1`}>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-3 rounded-2xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Visual Mathematics</h3>
                <p className="text-gray-700 leading-relaxed font-medium">Understand complex mathematical concepts through clear diagrams and visual representations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- QUICK EXPLAINER ---------- */
function QuickExplainerSection() {
  return (
    <section className={`${getChildFriendlyClasses.hero}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <Lightbulb className="h-12 w-12 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent leading-tight">Moments of Clarity</h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Experience breakthrough understanding when complex concepts become instantly clear through AI-powered explanations.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`${getChildFriendlyClasses.card} text-center hover:rotate-2`}>
            <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-blue-700 leading-tight">Simplified Explanations</h3>
            <p className="text-gray-700 leading-relaxed font-medium">Complex topics broken down into clear, accessible explanations with practical examples.</p>
          </div>
          <div className="col-span-2 flex justify-center items-center p-0 rounded-xl bg-transparent shadow-none border-0 transition-all duration-300 text-foreground">
            <div className="w-full max-w-lg p-0 relative">
              <div className="relative rounded-3xl overflow-hidden border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 to-orange-100 shadow-2xl">
                <video 
                  src="/lana intro landing.mp4" 
                  controls={false}
                  muted={true}
                  className="w-full h-auto object-cover video-element"
                  ref={(el) => {
                    if (el) {
                      el.volume = 0.7; // Set default volume to 70%
                      // Update volume icon based on muted state
                      const updateVolumeIcon = () => {
                        const container = el.closest('.relative');
                        if (container) {
                          if (el.muted) {
                            container.classList.add('video-muted');
                            container.classList.remove('video-unmuted');
                            // Hide unmuted icon, show muted icon
                            const unmutedIcon = container.querySelector('.volume-unmuted');
                            const mutedIcon = container.querySelector('.volume-muted');
                            if (unmutedIcon) unmutedIcon.classList.add('hidden');
                            if (mutedIcon) mutedIcon.classList.remove('hidden');
                          } else {
                            container.classList.add('video-unmuted');
                            container.classList.remove('video-muted');
                            // Show unmuted icon, hide muted icon
                            const unmutedIcon = container.querySelector('.volume-unmuted');
                            const mutedIcon = container.querySelector('.volume-muted');
                            if (unmutedIcon) unmutedIcon.classList.remove('hidden');
                            if (mutedIcon) mutedIcon.classList.add('hidden');
                          }
                        }
                      };
                                      
                      // Initial state setup
                      setTimeout(() => {
                        const container = el.closest('.relative');
                        if (container) {
                          const unmutedIcon = container.querySelector('.volume-unmuted');
                          const mutedIcon = container.querySelector('.volume-muted');
                          // Initially show muted icon since video starts muted
                          if (unmutedIcon) unmutedIcon.classList.add('hidden');
                          if (mutedIcon) mutedIcon.classList.remove('hidden');
                        }
                      }, 0);
                                      
                      // Update when muted state changes
                      el.addEventListener('volumechange', updateVolumeIcon);
                    }
                  }}
                  onClick={(e) => {
                    const video = e.currentTarget;
                    if (video.paused) {
                      video.play().then(() => {
                        video.muted = false;
                      }).catch(e => console.log("Autoplay prevented: ", e));
                    } else {
                      if (!video.muted) {
                        video.muted = true;
                      } else {
                        video.muted = false;
                      }
                    }
                  }}
                  loop
                  playsInline
                />
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-900/10 via-transparent to-yellow-900/10"></div>
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-yellow-900/10 via-transparent to-yellow-900/10"></div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <div className="volume-container relative w-4 h-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2 h-4 w-4 absolute top-0 left-0 volume-unmuted">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-x h-4 w-4 absolute top-0 left-0 volume-muted">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- MORE FEATURES ---------- */
function MoreFeaturesSection() {
  return (
    <section className={`${getChildFriendlyClasses.section}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-purple-500" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">Additional Learning Features</h2>
          <p className="text-gray-700 mt-4 max-w-2xl mx-auto text-base md:text-lg font-medium leading-relaxed">
            Comprehensive tools designed to enhance clarity and effectiveness in learning outcomes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`${getChildFriendlyClasses.card} text-center hover:rotate-1`}>
            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-blue-700 leading-tight">Progress Reports</h3>
            <p className="text-gray-700 text-sm mt-2 font-medium">Monitor your learning advancement and achievements.</p>
          </div>
          <div className={`${getChildFriendlyClasses.card} text-center hover:-rotate-1`}>
            <div className="bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-blue-700 leading-tight">Performance Analytics</h3>
            <p className="text-gray-700 text-sm mt-2 font-medium">Visual data representing your learning progress.</p>
          </div>
          <div className={`${getChildFriendlyClasses.card} text-center hover:rotate-1`}>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-blue-700 leading-tight">AI Assistant</h3>
            <p className="text-gray-700 text-sm mt-2 font-medium">Your intelligent educational support system.</p>
          </div>
          <div className={`${getChildFriendlyClasses.card} text-center hover:-rotate-1`}>
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MoreHorizontal className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-blue-700 leading-tight">Enhanced Features</h3>
            <p className="text-gray-700 text-sm mt-2 font-medium">Additional tools for comprehensive learning support.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- CONTACT ---------- */
function ContactSection() {
  return (
    <section id="contact" className={`${getChildFriendlyClasses.hero}`}>
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="flex justify-center mb-4">
          <MessageCircle className="h-12 w-12 text-blue-500" />
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">Contact Our Team</h2>
        <p className="text-gray-700 mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
          Have questions about our learning platform? We're here to help you get started.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a 
            href="mailto:sales@lana.ai" 
            className={`${getChildFriendlyClasses.button} inline-flex items-center justify-center gap-2 min-w-44`}
          >
            <Mail className="h-5 w-5" />
            Email Us
          </a>
          <a 
            href="mailto:contact@lanamind.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`${getChildFriendlyClasses.buttonSecondary} inline-flex items-center justify-center gap-2 min-w-44`}
          >
            <Calendar className="h-5 w-5" />
            Schedule Consultation
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------- FOOTER ---------- */
function Footer() {
  const footerLinks = {
    Product: ["Features", "Pricing", "Demo", "API"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Legal: ["Privacy Policy", "Terms of Service", "Security Policy", "Cookie Policy"],
    Support: ["Term Plan", "Feedback", "Settings"]
  }
  return (
    <footer className="border-t border-border py-8 md:py-16 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5 md:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Lana AI</Link>
            <p className="text-gray-700 text-sm mt-3 max-w-md leading-relaxed font-medium">
              Delivering clear, AI-powered learning experiences for children worldwide.
            </p>
            <div className="flex gap-3 sm:gap-4 mt-5">
              <Link 
                href="#" 
                aria-label="Twitter" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-white hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-sm shadow-md"
              >
                <Twitter className="h-5 w-5 text-blue-500" />
              </Link>
              <Link 
                href="#" 
                aria-label="Facebook" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-white hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-sm shadow-md"
              >
                <Facebook className="h-5 w-5 text-blue-500" />
              </Link>
              <Link 
                href="#" 
                aria-label="Instagram" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-white hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-sm shadow-md"
              >
                <Instagram className="h-5 w-5 text-pink-500" />
              </Link>
              <Link 
                href="#" 
                aria-label="LinkedIn" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-white hover:shadow-md hover:scale-110 transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-sm shadow-md"
              >
                <Linkedin className="h-5 w-5 text-blue-600" />
              </Link>
            </div>
          </div>
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div key={cat}>
              <h4 className="text-sm font-bold uppercase tracking-wide text-blue-700 mb-4 leading-tight">{cat}</h4>
              <ul className="space-y-3 text-sm text-gray-700 font-medium">
                {links.map((l) => (
                  <li key={l}>
                    <Link 
                      href={
                        l === "Term Plan" ? "/term-plan" :
                        l === "Feedback" ? "/feedback" :
                        l === "Settings" ? "/settings" :
                        l === "Privacy Policy" ? "/privacy-policy" :
                        l === "Terms of Service" ? "/terms-of-service" :
                        l === "Security Policy" ? "/security-policy" :
                        l === "Cookie Policy" ? "/cookie-policy" :
                        l === "About" ? "/about" :
                        l === "Blog" ? "/blog" :
                        l === "Careers" ? "/careers" :
                        l === "Contact" ? "/contact" :
                        l === "Demo" ? "/demo" :
                        l === "API" ? "/api" :
                        "#"
                      }
                      className="hover:text-purple-600 hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-gray-600 font-medium">
          © {new Date().getFullYear()} Lana AI. All rights reserved. Committed to clear learning for all children.
        </div>
      </div>
    </footer>
  )
}

/* ---------- PAGE ---------- */
export default function Home() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); setTheme("light") }, [])
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-foreground font-sans">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 xs:focus:top-4 focus:left-3 xs:focus:left-4 focus:z-50 focus:bg-white focus:text-gray-800 focus:px-3 xs:focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-blue-400"
      >
        Skip to main content
      </a>
      
      <Header />
      <main id="main-content" className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <LanaSection />
        <EducationalApproachSection />
        <TermPlansSection />
        <StructuredLessonsSection />
        <MathTutorSection />
        <QuickExplainerSection />
        <MoreFeaturesSection />
        <PricingSection />
        <CtaSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}