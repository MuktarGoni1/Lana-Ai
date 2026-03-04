// Server-side rendered pricing page for optimal SEO
// No "use client" - content visible to Googlebot immediately

import { Metadata } from 'next'
import Link from 'next/link'
import { SEO_CONFIG } from '@/lib/seo-config'
import { PRICING_CONFIG } from '@/lib/pricing-config'
import { CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pricing | LanaMind – AI Tutoring Plans',
  description: 'Choose the perfect plan for your family\'s learning needs. LanaMind offers flexible pricing with personalized AI tutoring, progress tracking, and parent dashboard features.',
  keywords: [
    'ai tutoring pricing',
    'personalized learning cost',
    'online tutoring plans',
    'ai education pricing',
    'family learning subscription',
    'student tutoring plans'
  ],
  openGraph: {
    title: 'LanaMind Pricing - Affordable AI Tutoring Plans',
    description: 'Flexible pricing plans for personalized AI tutoring. Start free, upgrade as you grow.',
    url: 'https://lanamind.com/pricing',
  },
  alternates: {
    canonical: 'https://lanamind.com/pricing',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Static pricing data for SSR
const PLANS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started with AI tutoring',
    features: [
      '5 lessons per month',
      'Basic progress tracking',
      'Email support',
      'Access to core subjects',
      'Standard response time'
    ],
    popular: false
  },
  {
    name: 'Family',
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: 'Best for families with active learners',
    features: [
      'Unlimited lessons',
      'Advanced progress analytics',
      'Priority support',
      'All subjects & features',
      'Parent dashboard',
      'Downloadable reports',
      'Faster AI responses'
    ],
    popular: true
  },
  {
    name: 'Family Plus',
    monthlyPrice: 39,
    yearlyPrice: 29,
    description: 'For families wanting the complete experience',
    features: [
      'Everything in Family',
      'Multiple student profiles',
      '1-on-1 tutoring sessions',
      'Custom curriculum',
      'API access',
      'Dedicated support',
      'White-label options'
    ],
    popular: false
  }
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the plan that's right for your family. All paid plans include a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-slate-900 text-white shadow-2xl scale-105 transform z-10'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block bg-[#FACC15] text-slate-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">${plan.monthlyPrice}</span>
                  <span className={`text-sm ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>/month</span>
                </div>
                <p className={`mb-8 font-medium ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className={`h-5 w-5 ${plan.popular ? 'text-yellow-400' : 'text-green-500'}`} />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/register"
                  className={`w-full block text-center py-4 rounded-full font-bold transition-all ${
                    plan.popular
                      ? 'bg-[#FACC15] text-slate-900 hover:bg-[#EAB308]'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.monthlyPrice === 0 ? 'Get Started Free' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">Can I change plans anytime?</h3>
                <p className="text-slate-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">Is there a free trial?</h3>
                <p className="text-slate-600">Yes, all paid plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-slate-600">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-slate-600 mb-4">Have questions? We're here to help.</p>
            <Link 
              href="/contact" 
              className="inline-block rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
