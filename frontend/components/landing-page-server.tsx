// Server-side rendered landing page component
// This ensures Googlebot sees the content immediately
// No "use client" directive - pure SSR for SEO

import Link from "next/link"
import Image from "next/image"
import { 
  CheckCircle2, 
  GraduationCap, 
  Lightbulb, 
  Bot, 
  Zap, 
  Calendar, 
  BookOpen, 
  Calculator, 
  Sparkles,
  Trophy,
  Heart,
  Star
} from "lucide-react"

/* ---------- STYLES ---------- */
const getChildFriendlyClasses = {
  card: "rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden",
  button: "rounded-full bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-extrabold py-4 px-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 inline-block",
  buttonSecondary: "rounded-full bg-white text-slate-700 font-bold py-4 px-8 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 border border-slate-200 inline-block",
  section: "py-16 bg-white",
  sectionAlt: "py-16 bg-slate-50", 
  hero: "py-12 bg-white",
}

const getPastelBg = (index: number) => {
  const colors = [
    "bg-[#F3F0FF]",
    "bg-[#ECFDF5]",
    "bg-[#FFF7ED]",
    "bg-[#EFF6FF]",
  ]
  return colors[index % colors.length]
}

const FEATURES = [
  "Personalised and Adaptive lessons tailored to your age and learning pace",
  "Real-time progress reports for parents",
  "Crystal-clear explanations by Lana AI",
  "Personalized learning avatar",
  "Structured learning paths",
  "Explanatory videos for every concept",
  "Automated revision reminders",
  "Performance reporting",
] as const

/* ---------- HERO SECTION ---------- */
function HeroSection() {
  return (
    <section id="hero" className="py-12 md:py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full w-fit border border-purple-100">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">Learning Made Clear!</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
              Your AI-powered <br/>
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">afterclass tutor!</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium max-w-lg">
              Learn with our AI tutor that provides clear, age-appropriate explanations for every concept.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              <Link href="/register" className={getChildFriendlyClasses.button}>
                Start Learning
              </Link>
              <Link href="/login" className={getChildFriendlyClasses.buttonSecondary}>
                Sign In
              </Link>
            </div>

            <div className="pt-6">
              <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Key Features:</p>
              <ul className="space-y-3">
                {FEATURES.slice(0,4).map((f) => (
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
              muted
              loop
              playsInline
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- FEATURES SECTION ---------- */
function FeaturesSection() {
  const features = [
    { title: "Structured Paths", desc: "Organized lesson sequences that build knowledge step by step.", icon: Calendar },
    { title: "Clear Explanations", desc: "Step-by-step guidance making topics accessible for your age.", icon: BookOpen },
    { title: "Math Assistance", desc: "Interactive support with visual aids and examples.", icon: Calculator },
    { title: "Instant Clarity", desc: "Immediate answers to difficult questions when you're stuck.", icon: Zap },
    { title: "Learning Videos", desc: "Explanatory videos that bring concepts to life.", icon: Sparkles },
    { title: "AI Companion", desc: "Always there to help you learn with personalized support.", icon: Bot },
  ]
  
  return (
    <section id="features" className={getChildFriendlyClasses.sectionAlt}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
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
            Lana AI uses smart technology to break down complex topics into easy-to-understand lessons that match your age and learning style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, index) => (
            <div 
              key={f.title} 
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

/* ---------- STRUCTURED LESSONS SECTION ---------- */
function StructuredLessonsSection() {
  return (
    <section className={getChildFriendlyClasses.section}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Structured Learning</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Our AI technology breaks down complex topics into bite-sized lessons that are easy to understand and remember.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Progressive Learning", icon: BookOpen, color: "bg-orange-50", desc: "Lessons build on each other so you master one concept before moving to the next." },
            { title: "Building Foundations", icon: GraduationCap, color: "bg-purple-50", desc: "Strong basics help you understand harder topics later." },
            { title: "Interactive Reinforcement", icon: Lightbulb, color: "bg-blue-50", desc: "Practice and review help you remember what you've learned." }
          ].map((item, i) => (
            <div key={i} className={`p-8 rounded-3xl ${item.color} border border-slate-100 text-center`}>
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <item.icon className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">{item.title}</h3>
              <p className="text-slate-600 font-medium">{item.desc}</p>
            </div>
          ))}
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
            <div className="relative w-full max-w-md aspect-square rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 bg-purple-50">
              <Image 
                src="/Updated Avatar.png" 
                alt="Lana AI - Your personal AI tutor" 
                fill
                className="object-cover p-8"
                priority
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
              Lana is your dedicated AI tutor that transforms complex concepts into clear, age-appropriate explanations. Patient, always available, and ready to help whenever you need it.
            </p>
            
            <div className="space-y-4">
              {[
                { label: "Patient Guidance", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50", desc: "Never feel rushed - Lana explains things as many times as you need." },
                { label: "Intelligent Support", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50", desc: "Lana adapts explanations to match how you learn best." },
                { label: "Reliable Assistance", icon: Heart, color: "text-red-500", bg: "bg-red-50", desc: "Always there when you need help, day or night." }
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color} flex-shrink-0 mt-1`} />
                  <div>
                    <span className="text-slate-900 font-bold">{item.label}</span>
                    <p className="text-slate-700 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- CTA SECTION ---------- */
function CtaSection() {
  return (
    <section className="py-20 mx-4">
      <div className="max-w-7xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of students learning with Lana. Our AI breaks down complex topics into simple, age-appropriate lessons. Parents get real-time progress reports and automated revision reminders to keep learning on track.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">Personalized Learning Paths</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">Progress Reports for Parents</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">Revision Reminders</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link 
                href="/register"
                className={getChildFriendlyClasses.button}
              >
                Get Started Now
              </Link>
              <Link href="/login" className="rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold py-4 px-8 hover:bg-white/20 transition-all inline-block">
                Sign In
              </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- TRUST SIGNALS SECTION ---------- */
function TrustSignalsSection() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Social Proof Badge */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200">
            <span className="text-yellow-500 text-xl">⭐⭐⭐⭐⭐</span>
            <span className="font-bold text-slate-900">Trusted by 10,000+ families worldwide</span>
          </div>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-70">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-bold text-lg">COPPA Compliant</span>
            </div>
            <span className="text-sm text-slate-500">Child Safety First</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-blue-600">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="font-bold text-lg">SSL Secured</span>
            </div>
            <span className="text-sm text-slate-500">256-bit Encryption</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-purple-600">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span className="font-bold text-lg">GDPR Ready</span>
            </div>
            <span className="text-sm text-slate-500">Data Protection</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1 text-orange-600">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
              <span className="font-bold text-lg">30-Day Guarantee</span>
            </div>
            <span className="text-sm text-slate-500">Money Back Promise</span>
          </div>
        </div>

        {/* Testimonials Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "LanaMind has transformed how my daughter approaches math. She's more confident and actually enjoys studying now!",
              author: "Sarah M.",
              role: "Parent of 10-year-old",
              rating: 5
            },
            {
              quote: "The personalized learning path helped my son catch up in just 3 months. Worth every penny!",
              author: "Michael K.",
              role: "Parent of 12-year-old",
              rating: 5
            },
            {
              quote: "As a teacher, I recommend LanaMind to all my students. It adapts perfectly to each child's needs.",
              author: "Jennifer L.",
              role: "5th Grade Teacher",
              rating: 5
            }
          ].map((testimonial, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="text-yellow-500 mb-3">
                {'⭐'.repeat(testimonial.rating)}
              </div>
              <p className="text-slate-700 mb-4 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-bold">{testimonial.author[0]}</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- MAIN COMPONENT ---------- */
export default function LandingPageServer() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans selection:bg-yellow-200">
      <main id="main-content" className="flex-grow">
        <HeroSection />
        <TrustSignalsSection />
        <FeaturesSection />
        <LanaSection />
        <StructuredLessonsSection />
        <CtaSection />
      </main>
    </div>
  )
}
