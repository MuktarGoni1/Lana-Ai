"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
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
} from "lucide-react"

/* ---------- CONFIG ---------- */
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
{ name: "Family", price: 15, desc: "Connect parent and student", popular: true, feats: ["Up to 2 students", "Parent dashboard", "Real-time reports", "Push notifications"] },
{ name: "Family Plus", price: 23, desc: "For larger families", feats: ["Up to 5 students", "Advanced analytics", "Weekly summaries", "Priority support"] },
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
      <div className="inline-flex items-center justify-center rounded-md w-9 h-9" />
    )
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-xl w-9 h-9 hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={resolvedTheme === "dark"}
    >
      {resolvedTheme === "dark" ? (
        <Moon className="h-5 w-5 text-blue-400 dark:text-blue-400 dark:hover:text-blue-300" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5 text-yellow-500 dark:text-blue-400 dark:hover:text-blue-300" aria-hidden="true" />
      )}
    </button>
  )
}

/* ---------- HEADER ---------- */
function Header() {
  const [open, setOpen] = useState(false)
  const { user } = useUnifiedAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-b from-gray-100/90 to-stone-200/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-foreground">LanaMind</span>

          {/* desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'Pricing', 'Contact'].map((l) => (
              <Link 
                key={l} 
                href={
                  l === 'Features' ? '/features' :
                  l === 'Pricing' ? '/pricing' :
                  '#contact'} // Keep contact as anchor since it's on same page
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {l}
              </Link>
            ))}
            <Link 
              href="/term-plan" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Term Plan
            </Link>
            <Link 
              href="/feedback" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Feedback
            </Link>
            <Link 
              href="/settings" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Settings
            </Link>
            <ThemeToggle />
            {user ? (
              <Link 
                href="/homepage" 
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-32"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* mobile burger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-xl hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" /> : <Menu className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" />}
          </button>
        </div>

        {/* mobile panel */}
        <div
          id="mobile-nav"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <nav className="flex flex-col gap-4 py-4">
            {['Features', 'Pricing', 'Contact'].map((l) => (
              <Link 
                key={l} 
                href={
                  l === 'Features' ? '/features' :
                  l === 'Pricing' ? '/pricing' :
                  '#contact'} // Keep contact as anchor since it's on same page
                onClick={() => setOpen(false)} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2"
              >
                {l}
              </Link>
            ))}
            <Link 
              href="/term-plan" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-2"
            >
              Term Plan
            </Link>
            <Link 
              href="/feedback" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-2"
            >
              Feedback
            </Link>
            <Link 
              href="/settings" 
              onClick={() => setOpen(false)} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-2"
            >
              Settings
            </Link>
            <div className="mt-2 flex items-center gap-2 pt-2 border-t border-border">
              <ThemeToggle />
              {user ? (
                <Link 
                  href="/homepage" 
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] w-full"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background py-3 px-2 flex-1 text-center min-h-12 flex items-center justify-center"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] flex-1 min-h-12"
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

  return (
    <section id="hero" className="py-12 md:py-20 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight">
            {user ? `Welcome back, ${user.email}` : "Your Ai Learning Companion."}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
            {user 
              ? "Continue your learning journey with personalized tutoring that adapts to your unique style."
              : "Personalized tutoring that adapts to your child's unique learning style, while keeping you connected to their progress."
            }
          </p>
          {!user && (
            <p className="text-xs sm:text-sm md:text-base text-foreground leading-relaxed italic">
              Revolutionizing the future of learning by using cutting edge Ai technology.
              Lana is not aiming towards replacing regular tutors and classes, we are an after-class tutoring system that lets users input all their school topics/syllabi and we help them break it down in an easy and understandable way using Ai.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {user ? (
              <Link 
                href="/homepage" 
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-40"
              >
                Continue Learning
                <ArrowRight className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-40 flex-1 sm:flex-none"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" />
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-foreground min-h-12 min-w-40 flex-1 sm:flex-none"
                >
                  Login
                </Link>
              </>
            )}
          </div>
          {!user && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Already have an account? <Link href="/login" className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded">Sign in</Link> to continue your learning journey.
            </p>
          )}
          <ul className="space-y-2 pt-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 dark:text-blue-400 dark:hover:text-blue-300" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative h-80 md:h-96 lg:h-full rounded-2xl overflow-hidden shadow-xl">
          <Image 
            src="/first-section.jpg" 
            alt="Lana AI hero" 
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}

/* ---------- FEATURES ---------- */
function FeaturesSection() {
  const features = [
    { title: "Learn with term plans", desc: "Structured curriculum planning to guide your child's learning journey systematically.", icon: Calendar },
    { title: "Structured lessons", desc: "Organized, step-by-step learning paths that break down complex topics into digestible parts.", icon: BookOpen },
    { title: "Math tutor", desc: "Expert assistance with step-by-step math problem solving and visual aids.", icon: Calculator },
    { title: "Quick explainer", desc: "Instant clarifications for complex topics that need immediate understanding.", icon: Zap },
    { title: "And more", desc: "Additional educational tools designed for modern learning experiences.", icon: MoreHorizontal },
  ]
  return (
    <section id="features" className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800/30 dark:to-gray-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Core Features</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Everything You Need to Succeed in Learning</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Lana AI combines cutting-edge technology with proven educational methods to create a learning experience that's both effective and engaging.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {features.map((f, index) => (
            <div 
              key={f.title} 
              className="rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
              <f.icon className="text-primary h-6 w-6 mb-3 dark:text-blue-400 dark:hover:text-blue-300" />
              <h3 className="text-xl font-semibold mb-3 text-foreground leading-tight">{f.title}</h3>
              <p className="text-foreground/90 text-base leading-relaxed">{f.desc}</p>
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
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Structured Learning</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Organized Lessons for Better Learning</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Our structured lessons break down complex topics into digestible parts, making learning more effective and engaging.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Step-by-Step Approach</h3>
            <p className="text-foreground/90 leading-relaxed">Lessons are carefully structured to build upon each other, ensuring solid understanding.</p>
          </div>
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Progressive Learning</h3>
            <p className="text-foreground/90 leading-relaxed">Each lesson builds on previous knowledge, creating a solid foundation for advanced topics.</p>
          </div>
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Interactive Content</h3>
            <p className="text-foreground/90 leading-relaxed">Engaging activities and quizzes reinforce learning at each step of the way.</p>
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
  return (
    <section id="pricing" className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Pricing</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">Choose the plan that's right for you. All plans include a 14-day free trial.</p>

          <div className="mt-6 inline-flex rounded-full bg-muted p-1" role="tablist" aria-label="Billing frequency">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ease-in-out ${interval === "monthly" ? "bg-background shadow" : "text-muted-foreground"} hover:bg-accent hover:shadow-lg hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/30 dark:hover:shadow-lg`}
              aria-pressed={interval === "monthly"}
              role="tab"
              aria-selected={interval === "monthly"}
              tabIndex={interval === "monthly" ? 0 : -1}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ease-in-out ${interval === "yearly" ? "bg-background shadow" : "text-muted-foreground"} hover:bg-accent hover:shadow-lg hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/30 dark:hover:shadow-lg`}
              aria-pressed={interval === "yearly"}
              role="tab"
              aria-selected={interval === "yearly"}
              tabIndex={interval === "yearly" ? 0 : -1}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 text-foreground ${"popular" in p && p.popular ? "border-primary shadow-lg" : ""}`}>
              {"popular" in p && p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="space-y-2 mb-4">
                <h3 className="text-xl font-bold text-foreground leading-tight">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">${p.price}</span>
                  <span className="text-muted-foreground">{periodLabel}</span>
                </div>
                <p className="text-foreground/90 leading-relaxed">{p.desc}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 dark:text-blue-400 dark:hover:text-blue-300" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full rounded-xl bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12"
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
    <section id="get-started" className="py-20 md:py-32 bg-gradient-to-r from-gray-700 to-stone-800 text-white rounded-3xl mx-4 my-16 p-8 md:p-12 shadow-xl">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
          {user 
            ? "Continue Your Learning Journey" 
            : "Give Your Child the Gift of Personalized Learning — While You Stay Connected"
          }
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          {user
            ? "Keep making progress with personalized AI tutoring and stay connected to your learning journey."
            : "Join thousands of families who trust Lana AI to help their children learn, grow, and succeed. Start your free trial today."
          }
        </p>
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          {user ? (
            <Link 
              href="/homepage" 
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-44"
            >
              Continue Learning
              <ArrowRight className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" />
            </Link>
          ) : (
            <>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm sm:text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-44 flex-1 sm:flex-none"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-3 text-sm sm:text-base font-medium hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-foreground min-h-12 min-w-44 flex-1 sm:flex-none"
              >
                Login to Your Account
              </Link>
              <Link 
                href="#contact" 
                className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-foreground min-h-12 min-w-44 flex-1 sm:flex-none"
              >
                Contact Sales
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
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/30 bg-gradient-to-br from-gray-200 to-stone-200 dark:from-gray-800/50 dark:to-stone-800/50">
              <Image 
                src="/Updated Avatar.png" 
                alt="Lana AI - Your Personalized Learning Companion" 
                fill
                className="object-cover object-center p-2 rounded-2xl"
                priority
              />
            </div>
          </div>
          <div className="lg:w-1/2 text-center lg:text-left">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 inline-block">AI-Powered Learning</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground mb-6 leading-tight">Meet Lana, Your Personalized AI Tutor</h2>
            <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-2xl leading-relaxed">
              Lana is your child's dedicated AI learning companion, designed to explain complex concepts in ways that make sense to them. With personalized explanations and patient guidance, Lana adapts to your child's unique learning style.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- EDUCATIONAL APPROACH ---------- */
function EducationalApproachSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Our Approach</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Proven Educational Methodology</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Our approach combines adaptive learning techniques with personalized instruction to maximize educational outcomes.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-auto">
          <div className="lg:w-1/2">
            <div className="bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Bot className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">AI-Powered Adaptation</h3>
                  <p className="text-foreground/90 leading-relaxed">The system adapts to each learner's pace and style, providing personalized content and challenges.</p>
                </div>
              </div>
            </div>
            <div className="bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl mt-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Progress Tracking</h3>
                  <p className="text-foreground/90 leading-relaxed">Detailed insights help students, parents, and teachers monitor growth and identify areas for improvement.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
              <Image 
                src="/Happy child.jpg" 
                alt="Happy child engaged in learning with Lana AI" 
                width={600}
                height={400}
                className="object-cover object-center"
                priority
              />
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
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Curriculum Planning</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Structured Curriculum for Long-term Success</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Our term plans provide a systematic approach to learning, ensuring comprehensive coverage of essential topics.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Long-term Planning</h3>
            <p className="text-foreground/90 leading-relaxed">Comprehensive curriculum plans spanning weeks and months to ensure steady progress.</p>
          </div>
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Milestone Tracking</h3>
            <p className="text-foreground/90 leading-relaxed">Clear checkpoints to measure achievement and adjust learning paths as needed.</p>
          </div>
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Flexible Adjustments</h3>
            <p className="text-foreground/90 leading-relaxed">Adapt curriculum plans based on individual learning pace and evolving needs.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- MATH TUTOR ---------- */
function MathTutorSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Math Assistance</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Expert Math Tutoring at Your Fingertips</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Get step-by-step math help with visual aids and clear explanations for every problem.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Calculator className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Step-by-Step Solutions</h3>
                <p className="text-foreground/90 leading-relaxed">Understand how to solve problems with detailed explanations for each step.</p>
              </div>
            </div>
          </div>
          <div className="bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Visual Problem Solving</h3>
                <p className="text-foreground/90 leading-relaxed">See diagrams and visual aids that clarify complex mathematical concepts.</p>
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
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Instant Clarification</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Quick Answers to Complex Topics</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Get instant explanations for difficult concepts with simple, easy-to-understand examples.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4 dark:text-blue-400 dark:hover:text-blue-300" />
            <h3 className="text-xl font-semibold mb-2 text-foreground leading-tight">Concept Simplification</h3>
            <p className="text-foreground/90 leading-relaxed">Complex topics broken down into simple, digestible explanations.</p>
          </div>
          <div className="col-span-2 flex justify-center items-center p-0 rounded-xl bg-transparent shadow-none border-0 transition-all duration-300 text-foreground">
            <div className="w-full max-w-lg p-0 relative">
              <div className="relative rounded-lg overflow-hidden border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
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
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-stone-900/10 via-transparent to-stone-900/10"></div>
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-stone-900/10 via-transparent to-stone-900/10"></div>

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
    <section className="py-16 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Plus More</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Additional Learning Tools</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Explore additional features designed to enhance the learning experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 group dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
            </div>
            <h3 className="font-semibold text-foreground leading-tight">Progress Reports</h3>
          </div>
          <div className="text-center p-4 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 group dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
            </div>
            <h3 className="font-semibold text-foreground leading-tight">Performance Analytics</h3>
          </div>
          <div className="text-center p-4 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 group dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
            </div>
            <h3 className="font-semibold text-foreground leading-tight">AI Guidance</h3>
          </div>
          <div className="text-center p-4 rounded-xl border bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 group dark:hover:shadow-blue-500/30 dark:hover:shadow-xl text-foreground">
            <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MoreHorizontal className="h-8 w-8 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
            </div>
            <h3 className="font-semibold text-foreground leading-tight">And More</h3>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- CONTACT ---------- */
function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-32 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Contact</span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 text-foreground leading-tight">Talk to our team</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          Reach out for demos, pricing questions, or partnership opportunities.
        </p>
        <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2">
          <a 
            href="mailto:sales@lana.ai" 
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] min-h-12 min-w-44 flex-1 sm:flex-none"
          >
            Email Sales
          </a>
          <a 
            href="mailto:contact@lanamind.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] text-foreground min-h-12 min-w-44 flex-1 sm:flex-none"
          >
            Book a Demo
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
    <footer className="border-t border-border py-8 md:py-16 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-5 md:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-foreground">Lana AI</Link>
            <p className="text-muted-foreground text-sm mt-3 max-w-md leading-relaxed">
              Empowering you and your child through personalized AI tutoring while keeping you connected to the learning journey.
            </p>
            <div className="flex gap-3 sm:gap-4 mt-5">
              <Link 
                href="#" 
                aria-label="Twitter" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="#" 
                aria-label="Facebook" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="#" 
                aria-label="Instagram" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
              <Link 
                href="#" 
                aria-label="LinkedIn" 
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-3 sm:p-2 rounded-full hover:bg-muted hover:shadow-md hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/50 dark:hover:shadow-xl"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground dark:text-blue-400 dark:hover:text-blue-300" />
              </Link>
            </div>
          </div>
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div key={cat}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4 leading-tight">{cat}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
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
                      className="hover:text-foreground hover:shadow-sm hover:scale-105 transition-all duration-300 ease-in-out dark:hover:shadow-blue-500/30 dark:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lana AI. All rights reserved.
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-100 via-stone-200 to-gray-300 dark:from-gray-800/30 dark:via-stone-800/30 dark:to-gray-800/30 text-foreground font-sans">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
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