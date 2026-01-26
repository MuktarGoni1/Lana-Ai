"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext"
import { createCheckoutSession } from "@/services/paymentService"
import {
  CheckCircle2,
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

/* 
   STYLING UTILS - UPDATED TO MATCH REFERENCE IMAGE 
   - Yellow Buttons
   - Pastel Card Backgrounds
   - Clean Slate Typography
*/
const getChildFriendlyClasses = {
  // Clean, pastel cards like the "Advanced Editing Tools" section in the image
  card: "rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden",
  
  // The specific Golden Yellow button from the reference image
  button: "rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-extrabold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
  
  // Secondary button (White with subtle border)
  buttonSecondary: "rounded-full bg-white text-slate-700 font-bold py-4 px-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 border border-slate-200",
  
  buttonSmall: "rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-bold py-3 px-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95",
  input: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
  
  // Clean white header
  header: "bg-white/90 backdrop-blur-md border-b border-slate-100",
  
  // Clean backgrounds instead of heavy gradients
  section: "py-16 bg-white",
  sectionAlt: "py-16 bg-slate-50", 
  hero: "py-12 bg-white",
};

// Helper for pastel backgrounds seen in the reference image (Purple, Green, Peach, Blue)
const getPastelBg = (index: number) => {
  const colors = [
    "bg-[#F3F0FF]", // Light Purple
    "bg-[#ECFDF5]", // Light Mint
    "bg-[#FFF7ED]", // Light Peach
    "bg-[#EFF6FF]", // Light Blue
  ];
  return colors[index % colors.length];
};

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
  
  if (!mounted) return <div className="w-12 h-12" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:outline-none"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Moon className="h-5 w-5 text-slate-700" />
      ) : (
        <Sun className="h-5 w-5 text-slate-700" />
      )}
    </button>
  )
}



/* ---------- HERO ---------- */
function HeroSection() {
  const { user } = useUnifiedAuth()
  const [isMuted, setIsMuted] = useState(true)

  return (
    <section id="hero" className="py-12 md:py-24 bg-white relative overflow-hidden">
      {/* Background blobs for subtle color like the reference image */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full w-fit border border-purple-100">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">Learning Made Clear!</span>
            </div>
            
            {/* Typography matching the 'Create Custom 3D Characters' style */}
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
              {user ? `Welcome back, ${user.email?.split('@')[0]}!` : (
                <>
                  Your AI-powered <br/>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">afterclass tutor!</span>
                </>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium max-w-lg">
              {user 
                ? "Continue your personalized learning journey with adaptive AI tutoring."
                : "Learn with our AI tutor that provides clear, age-appropriate explanations for every concept."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              {user ? (
                <Link href="/homepage" className={getChildFriendlyClasses.button}>
                  Continue Learning
                </Link>
              ) : (
                <>
                  <Link href="/register" className={getChildFriendlyClasses.button}>
                    Start Learning
                  </Link>
                  <Link href="/login" className={getChildFriendlyClasses.buttonSecondary}>
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="pt-6">
              <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Key Features:</p>
              <ul className="space-y-3">
                {FEATURES.slice(0,3).map((f) => (
                  <li key={f} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100 aspect-square sm:aspect-video lg:aspect-square">
             <video 
              src="/landing.mp4" 
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="object-cover w-full h-full"
            />
             {/* Simple Audio Toggle */}
             <button 
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm hover:bg-white transition-all"
             >
                {isMuted ? <span className="text-xs font-bold px-2">Unmute</span> : <span className="text-xs font-bold px-2">Mute</span>}
             </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- FEATURES (PASTEL CARDS) ---------- */
function FeaturesSection() {
  const features = [
    { title: "Structured Paths", desc: "Organized lesson sequences that build knowledge.", icon: Calendar },
    { title: "Clear Explanations", desc: "Step-by-step guidance making topics accessible.", icon: BookOpen },
    { title: "Math Assistance", desc: "Interactive support with visual aids.", icon: Calculator },
    { title: "Instant Clarity", desc: "Immediate answers to difficult questions.", icon: Zap },
    { title: "Additional Tools", desc: "Supplementary learning resources.", icon: Sparkles },
    { title: "AI Companion", desc: "Always there to help you learn.", icon: Bot },
  ]
  
  return (
    <section id="features" className={getChildFriendlyClasses.sectionAlt}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
           {/* CTA Box similar to the top of your reference image */}
          <div className="mb-12">
            <Link 
              href="/diagnostic-quiz"
              className={`${getChildFriendlyClasses.button} inline-flex items-center gap-2`}
            >
              <Trophy className="h-5 w-5" />
              Take the Diagnostic Quiz
            </Link>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">
            Everything for <span className="text-purple-600">Effective Learning</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Lana AI combines advanced technology with proven methods to create clear learning experiences.
          </p>
        </div>

        {/* Pastel Card Grid matching the reference image style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, index) => (
            <div 
              key={f.title} 
              // Using helper to cycle through pastel backgrounds
              className={`${getChildFriendlyClasses.card} ${getPastelBg(index)} p-8 flex flex-col items-start text-left`}
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                <f.icon className="text-slate-900 h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">{f.desc}</p>
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
    <section className={getChildFriendlyClasses.section}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Structured Learning</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Our systematic approach breaks complex topics into manageable segments.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Progressive Learning", icon: BookOpen, color: "bg-orange-50" },
            { title: "Building Foundations", icon: GraduationCap, color: "bg-purple-50" },
            { title: "Interactive Reinforcement", icon: Lightbulb, color: "bg-blue-50" }
          ].map((item, i) => (
            <div key={i} className={`p-8 rounded-3xl ${item.color} border border-slate-100 text-center`}>
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <item.icon className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">{item.title}</h3>
              <p className="text-slate-600 font-medium">Each concept reinforces prior knowledge for stronger retention.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- PRICING ---------- */
function PricingSection() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")
  const plans = PLANS[interval]
  const { user } = useUnifiedAuth()
  
  return (
    <section id="pricing" className={getChildFriendlyClasses.sectionAlt}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-600 text-lg font-medium">Choose the right plan for your educational goals.</p>

          <div className="mt-8 inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
            {["monthly", "yearly"].map((t) => (
              <button
                key={t}
                onClick={() => setInterval(t as "monthly" | "yearly")}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                  interval === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl p-8 transition-all duration-300 ${
                "popular" in p && p.popular 
                  ? "bg-slate-900 text-white shadow-2xl scale-105 transform z-10" 
                  : "bg-white text-slate-900 border border-slate-200 shadow-sm"
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">${p.price}</span>
                <span className={`text-sm ${"popular" in p && p.popular ? "text-slate-400" : "text-slate-500"}`}>/{interval}</span>
              </div>
              <p className={`mb-8 font-medium ${"popular" in p && p.popular ? "text-slate-300" : "text-slate-600"}`}>{p.desc}</p>
              
              <ul className="space-y-4 mb-8">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle2 className={`h-5 w-5 ${"popular" in p && p.popular ? "text-yellow-400" : "text-green-500"}`} />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href={user ? `/checkout?plan=${encodeURIComponent(p.name)}&interval=${encodeURIComponent(interval)}` : "/register"}
                className={`w-full block text-center py-4 rounded-full font-bold transition-all ${
                  "popular" in p && p.popular 
                    ? "bg-[#FACC15] text-slate-900 hover:bg-[#EAB308]" 
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
                onClick={(e) => {
                  if (user) {
                    e.preventDefault();
                    // Add security validation before redirecting to checkout
                    if (p.name !== 'Free') {
                      // Validate the plan is allowed
                      const allowedPlans = ['Family', 'Family Plus'];
                      if (allowedPlans.includes(p.name)) {
                        window.location.href = `/checkout?plan=${encodeURIComponent(p.name)}&interval=${encodeURIComponent(interval)}`;
                      } else {
                        // Handle invalid plan by showing error or redirecting
                        window.location.href = `/pricing?error=invalid_plan`;
                      }
                    } else {
                      // Free plan goes directly to homepage
                      window.location.href = '/homepage';
                    }
                  }
                }}
              >
                {p.price > 0 ? 'Get Started' : 'Sign Up Free'}
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
    <section className="py-20 mx-4">
      {/* Dark stylized CTA card similar to bottom of your image */}
      <div className="max-w-7xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            {user ? "Continue Your Learning Journey" : "Ready to Start Learning?"}
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Join students who are achieving better understanding through AI-powered learning. Begin your educational journey with clear explanations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link 
                href={user ? "/homepage" : "/register"}
                className={getChildFriendlyClasses.button}
              >
                {user ? "Go to Dashboard" : "Get Started Now"}
              </Link>
              {!user && (
                <Link href="/login" className="rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold py-4 px-8 hover:bg-white/20 transition-all">
                  Sign In
                </Link>
              )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- LANA SECTION ---------- */
function LanaSection() {
  return (
    <section className={getChildFriendlyClasses.hero}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 flex justify-center">
            {/* Clean card frame for image */}
            <div className="relative w-full max-w-md aspect-square rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 bg-purple-50">
              <Image 
                src="/Updated Avatar.png" 
                alt="Lana AI" 
                fill
                className="object-cover p-8"
              />
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full mb-6">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">AI Learning Friend</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Meet Lana, Your <span className="text-blue-600">AI Assistant</span></h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">
              Lana is your dedicated AI tutor that transforms complex concepts into clear, understandable explanations. Patient and always available.
            </p>
            
            <div className="space-y-4">
              {[
                { label: "Patient Guidance", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
                { label: "Intelligent Support", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Reliable Assistance", icon: Heart, color: "text-red-500", bg: "bg-red-50" }
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                  <span className="text-slate-900 font-bold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- MATH TUTOR & QUICK EXPLAINER (Using Pastel System) ---------- */
function MathTutorSection() {
  return (
    <section className={getChildFriendlyClasses.sectionAlt}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
           <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Math Learning Support</h2>
              <p className="text-slate-600 text-lg mb-8">Struggling with math? Our AI tutor provides detailed, step-by-step guidance.</p>
              
              <div className="grid gap-4">
                <div className="p-6 rounded-2xl bg-[#EFF6FF] border border-blue-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Detailed Problem Solving</h3>
                  <p className="text-slate-600">Master mathematical concepts through comprehensive explanations.</p>
                </div>
                <div className="p-6 rounded-2xl bg-[#ECFDF5] border border-green-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Visual Mathematics</h3>
                  <p className="text-slate-600">Understand complex concepts through clear diagrams.</p>
                </div>
              </div>
           </div>
           <div className="order-1 md:order-2 flex justify-center">
              <div className="bg-purple-100 p-8 rounded-[3rem] w-full max-w-md aspect-square flex items-center justify-center">
                <Calculator className="h-32 w-32 text-purple-600 opacity-80" />
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}

function QuickExplainerSection() {
  return (
    <section className={getChildFriendlyClasses.hero}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Moments of Clarity</h2>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-12">
          Experience breakthrough understanding when complex concepts become instantly clear.
        </p>
        
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 max-w-4xl mx-auto">
          <video 
            src="/lana intro landing.mp4" 
            controls={true}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  )
}

/* ---------- MAIN PAGE ---------- */
export default function Home() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); setTheme("light") }, [])
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans selection:bg-yellow-200">

      <main id="main-content" className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <LanaSection />
        <StructuredLessonsSection />
        <MathTutorSection />
        <QuickExplainerSection />
        <PricingSection />
        <CtaSection />
      </main>
    </div>
  )
}
