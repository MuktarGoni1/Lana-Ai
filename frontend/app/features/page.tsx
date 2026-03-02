// Server-side rendered features page for optimal SEO
// No "use client" - content visible to Googlebot immediately

import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SEO_CONFIG } from '@/lib/seo-config'
import { 
  Bot, 
  BookOpen, 
  BarChart3, 
  Users, 
  Zap, 
  Shield,
  Clock,
  GraduationCap,
  CheckCircle2
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features | LanaMind – AI Tutoring Platform',
  description: 'Discover LanaMind\'s powerful AI tutoring features including personalized learning paths, real-time progress tracking, adaptive assessments, and comprehensive parent dashboard.',
  keywords: [
    'ai tutoring features',
    'personalized learning tools',
    'educational ai capabilities',
    'student progress tracking',
    'adaptive learning technology',
    'parent dashboard features',
    'ai quiz generation',
    'learning analytics dashboard',
    'online tutoring features'
  ],
  openGraph: {
    title: 'LanaMind Features - AI-Powered Learning Tools',
    description: 'Explore our comprehensive suite of AI tutoring features designed for students and parents.',
    url: 'https://lanamind.com/features',
  },
  alternates: {
    canonical: 'https://lanamind.com/features',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const FEATURES = [
  {
    icon: Bot,
    title: 'AI-Powered Tutoring',
    description: 'Lana uses advanced AI to provide personalized explanations tailored to each student\'s learning style and pace.',
    highlights: ['Adaptive learning algorithms', 'Natural language understanding', '24/7 availability']
  },
  {
    icon: BookOpen,
    title: 'Structured Lessons',
    description: 'Comprehensive lesson plans that build knowledge progressively from fundamentals to advanced concepts.',
    highlights: ['Curriculum-aligned content', 'Step-by-step explanations', 'Interactive examples']
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Detailed insights into learning progress with visual reports and performance metrics.',
    highlights: ['Real-time tracking', 'Skill assessment', 'Learning gaps identification']
  },
  {
    icon: Users,
    title: 'Parent Dashboard',
    description: 'Stay informed with comprehensive parent dashboard showing your child\'s progress and achievements.',
    highlights: ['Progress reports', 'Activity monitoring', 'Goal setting']
  },
  {
    icon: Zap,
    title: 'Instant Help',
    description: 'Get immediate answers to questions with our quick explanation mode for homework help.',
    highlights: ['Quick mode responses', 'Homework assistance', 'Concept clarification']
  },
  {
    icon: Shield,
    title: 'Safe Learning Environment',
    description: 'COPPA-compliant platform with content filtering and privacy protection for young learners.',
    highlights: ['Content moderation', 'Privacy protection', 'Age-appropriate responses']
  }
]

const ADDITIONAL_FEATURES = [
  'Automated revision reminders',
  'Personalized study schedules',
  'Interactive quizzes & assessments',
  'Downloadable progress reports',
  'Multi-subject support',
  'Learning streak tracking',
  'Achievement badges',
  'Offline mode capability'
]

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
                Everything You Need for{' '}
                <span className="text-purple-600">Effective Learning</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                LanaMind combines cutting-edge AI technology with proven educational methods 
                to create the ultimate learning experience for students of all ages.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register"
                  className="rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all inline-block"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/demo"
                  className="rounded-full bg-white text-slate-700 font-bold py-4 px-8 border border-slate-200 hover:bg-slate-50 transition-all inline-block"
                >
                  Watch Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature) => (
                <div 
                  key={feature.title}
                  className="bg-slate-50 rounded-3xl p-8 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                    <feature.icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                How LanaMind Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Getting started is simple. Our platform guides students through personalized 
                learning journeys step by step.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Sign Up', desc: 'Create your account in seconds' },
                { step: '2', title: 'Set Goals', desc: 'Tell us what you want to learn' },
                { step: '3', title: 'Learn', desc: 'Study with personalized AI tutoring' },
                { step: '4', title: 'Track', desc: 'Monitor progress and achievements' }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FACC15] text-slate-900 font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">
                And Much More
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {ADDITIONAL_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Learning?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of students already learning with LanaMind's AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all inline-block"
              >
                Get Started Free
              </Link>
              <Link 
                href="/pricing"
                className="rounded-full bg-white/10 text-white border border-white/20 font-bold py-4 px-8 hover:bg-white/20 transition-all inline-block"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
