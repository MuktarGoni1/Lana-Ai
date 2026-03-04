// Server-side rendered about page for optimal SEO
// No "use client" - content visible to Googlebot immediately

import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SEO_CONFIG } from '@/lib/seo-config'
import { Heart, Target, Lightbulb, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | LanaMind – Our Mission & Story',
  description: 'Learn about LanaMind\'s mission to revolutionize education through personalized AI tutoring. Discover how we\'re making quality education accessible to every child.',
  keywords: [
    'about lanamind',
    'ai tutoring mission',
    'educational technology company',
    'personalized learning mission',
    'ai education startup',
    'online tutoring company'
  ],
  openGraph: {
    title: 'About LanaMind - Our Story & Mission',
    description: 'Discover how LanaMind is transforming education with AI-powered personalized tutoring.',
    url: 'https://lanamind.com/about',
  },
  alternates: {
    canonical: 'https://lanamind.com/about',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const VALUES = [
  {
    icon: Heart,
    title: 'Student-First',
    description: 'Every decision we make starts with what\'s best for the student\'s learning experience.'
  },
  {
    icon: Target,
    title: 'Accessibility',
    description: 'Quality education should be available to every child, regardless of location or background.'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We continuously improve our AI to provide better, more personalized learning experiences.'
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'We believe in partnering with parents and educators to support each child\'s journey.'
  }
]

const STATS = [
  { value: '10,000+', label: 'Students Helped' },
  { value: '500,000+', label: 'Lessons Delivered' },
  { value: '95%', label: 'Parent Satisfaction' },
  { value: '50+', label: 'Countries Reached' }
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
                Our Mission to Make Learning{' '}
                <span className="text-purple-600">Accessible to All</span>
              </h1>
              <p className="text-xl text-slate-600">
                LanaMind was founded with a simple belief: every child deserves a personalized 
                education that adapts to their unique learning style and pace.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-slate-900">Our Story</h2>
                <div className="space-y-4 text-slate-600">
                  <p>
                    LanaMind began when our founders recognized a fundamental problem in education: 
                    traditional one-size-fits-all approaches leave many students behind. Whether a 
                    child needs extra time to grasp concepts or is ready to accelerate beyond their 
                    grade level, the conventional classroom often cannot accommodate these differences.
                  </p>
                  <p>
                    We set out to create an AI tutor that could provide the personalized attention 
                    every student deserves. Lana, our AI tutor, uses advanced machine learning to 
                    understand each student\'s strengths, weaknesses, and learning preferences.
                  </p>
                  <p>
                    Today, LanaMind helps thousands of students worldwide achieve their full potential 
                    through adaptive, engaging, and effective AI-powered tutoring.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎓</div>
                    <p className="text-2xl font-bold text-slate-800">Empowering students worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#FACC15] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
                Our Core Values
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                These principles guide everything we do at LanaMind
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {VALUES.map((value) => (
                <div 
                  key={value.title}
                  className="bg-slate-50 rounded-3xl p-8 text-center hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
                    <value.icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why LanaMind */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl font-bold mb-6 text-slate-900">
                  Why LanaMind?
                </h2>
                <ul className="space-y-4">
                  {[
                    'Available 24/7 - Learn whenever it suits you',
                    'Personalized to each student\'s needs',
                    'Safe and secure learning environment',
                    'Aligned with educational standards',
                    'Affordable alternative to private tutoring',
                    'Detailed progress tracking for parents'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="text-[#FACC15] text-xl mt-0.5">✓</span>
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-white rounded-3xl p-8 shadow-lg">
                  <blockquote className="text-xl text-slate-600 italic mb-6">
                    "LanaMind has transformed how my daughter approaches learning. She\'s more 
                    confident and actually enjoys studying now."
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-bold">S</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Sarah Johnson</div>
                          <div className="text-slate-500">Parent of 10-year-old student</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
              Join Our Mission
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Be part of the education revolution. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all inline-block"
              >
                Get Started Free
              </Link>
              <Link 
                href="/contact"
                className="rounded-full bg-white text-slate-700 font-bold py-4 px-8 border border-slate-200 hover:bg-slate-50 transition-all inline-block"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
