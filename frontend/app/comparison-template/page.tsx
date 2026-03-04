import { Metadata } from 'next'
import Link from 'next/link'
import { SEO_CONFIG } from '@/lib/seo-config'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

// TEMPLATE: Copy this file for each competitor comparison
// Rename to: page.tsx in appropriate folder
// Example: app/vs-khanmigo/page.tsx, app/vs-synthesis/page.tsx

export const metadata: Metadata = {
  // UPDATE THESE for each competitor
  title: 'LanaMind vs [COMPETITOR_NAME]: Which is Better for Your Child? (2024)',
  description: 'Compare LanaMind and [COMPETITOR_NAME] side-by-side. See pricing, features, subjects, and find the best AI tutoring platform for your child.',
  keywords: [
    'lanamind vs [competitor]',
    '[competitor] alternative',
    'best ai tutoring platform',
    'ai tutor comparison',
    'online tutoring comparison'
  ],
  openGraph: {
    title: 'LanaMind vs [COMPETITOR_NAME]: Complete Comparison',
    description: 'Side-by-side comparison to help you choose the best AI tutor for your child.',
    url: 'https://lanamind.com/vs-[competitor]',
  },
  alternates: {
    canonical: 'https://lanamind.com/vs-[competitor]',
  },
}

// UPDATE THESE sections for each competitor
const COMPETITOR_NAME = '[COMPETITOR NAME]' // e.g., "Khanmigo"
const COMPETITOR_URL = '[COMPETITOR_URL]' // e.g., "https://khanmigo.ai"

// Comparison data - UPDATE for each competitor
const COMPARISON_DATA = {
  pricing: {
    lanamind: { monthly: '$19', yearly: '$15', free: true },
    competitor: { monthly: '$X', yearly: '$Y', free: false }
  },
  features: [
    {
      feature: '24/7 Availability',
      lanamind: true,
      competitor: true,
      notes: '[COMPETITOR] only available during [hours]'
    },
    {
      feature: 'Personalized Learning Paths',
      lanamind: true,
      competitor: true,
      notes: '[COMPETITOR] uses [method]'
    },
    {
      feature: 'Parent Dashboard',
      lanamind: true,
      competitor: true,
      notes: '[COMPETITOR] [details]'
    },
    {
      feature: 'Subjects Covered',
      lanamind: 'Math, Science, English, History',
      competitor: 'Math, Science',
      lanamindScore: 4,
      competitorScore: 3
    },
    // Add more features...
  ]
}

// UPDATE: Key differences
const KEY_DIFFERENCES = [
  {
    aspect: 'Pricing',
    lanamind: 'Free tier available. Paid plans start at $19/month with unlimited lessons.',
    competitor: '[COMPETITOR PRICING DETAILS]',
    winner: 'lanamind' // or 'competitor' or 'tie'
  },
  {
    aspect: 'Personalization',
    lanamind: 'AI adapts in real-time to learning style, pace, and knowledge gaps.',
    competitor: '[COMPETITOR PERSONALIZATION DETAILS]',
    winner: 'lanamind'
  },
  {
    aspect: 'Availability',
    lanamind: '24/7 instant access. No scheduling needed.',
    competitor: '[COMPETITOR AVAILABILITY]',
    winner: 'lanamind'
  }
]

// UPDATE: When to choose each
const WHEN_TO_CHOOSE = {
  lanamind: [
    'You want affordable, unlimited tutoring',
    'Your child needs help with multiple subjects',
    'You want detailed parent progress tracking',
    'You need 24/7 availability for homework help',
    'You prefer personalized learning paths'
  ],
  competitor: [
    '[When competitor is better choice 1]',
    '[When competitor is better choice 2]',
    '[When competitor is better choice 3]'
  ]
}

export default function ComparisonPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center">
              <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                Honest Comparison
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
                LanaMind vs {COMPETITOR_NAME}
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                Unbiased side-by-side comparison of features, pricing, and benefits. 
                Find the best AI tutoring platform for your child's learning journey.
              </p>
              
              {/* Quick Verdict */}
              <div className="bg-slate-900 text-white rounded-3xl p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Quick Verdict</h2>
                <p className="text-lg text-slate-300 mb-4">
                  <strong>Choose LanaMind if:</strong> You want affordable, personalized AI tutoring 
                  with comprehensive parent tracking and 24/7 availability.
                </p>
                <p className="text-lg text-slate-300">
                  <strong>Choose {COMPETITOR_NAME} if:</strong> [COMPETITOR_STRENGTHS]
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-12 text-slate-900 text-center">
              Side-by-Side Comparison
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-lg border border-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-left font-bold text-slate-900">Feature</th>
                    <th className="px-6 py-4 text-center font-bold text-purple-700 bg-purple-50">LanaMind</th>
                    <th className="px-6 py-4 text-center font-bold text-slate-900">{COMPETITOR_NAME}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Pricing Row */}
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-900">Monthly Price</td>
                    <td className="px-6 py-4 text-center bg-purple-50">
                      <span className="text-2xl font-bold text-purple-700">$19</span>
                      <span className="text-slate-500">/mo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl font-bold text-slate-900">$[X]</span>
                      <span className="text-slate-500">/mo</span>
                    </td>
                  </tr>
                  
                  {/* Free Tier */}
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-900">Free Plan</td>
                    <td className="px-6 py-4 text-center bg-purple-50">
                      <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                      <span className="text-sm text-slate-600">5 lessons/month</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {true ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>

                  {/* More comparison rows... */}
                  
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Key Differences */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-12 text-slate-900 text-center">
              Key Differences
            </h2>
            
            <div className="space-y-6">
              {KEY_DIFFERENCES.map((diff, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-slate-900">{diff.aspect}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded-xl ${diff.winner === 'lanamind' ? 'bg-green-50 border-2 border-green-200' : 'bg-slate-50'}`}>
                      <div className="font-bold text-purple-700 mb-2">LanaMind</div>
                      <p className="text-slate-700">{diff.lanamind}</p>
                      {diff.winner === 'lanamind' && (
                        <span className="inline-block mt-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">Winner</span>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl ${diff.winner === 'competitor' ? 'bg-green-50 border-2 border-green-200' : 'bg-slate-50'}`}>
                      <div className="font-bold text-slate-700 mb-2">{COMPETITOR_NAME}</div>
                      <p className="text-slate-700">{diff.competitor}</p>
                      {diff.winner === 'competitor' && (
                        <span className="inline-block mt-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">Winner</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* When to Choose */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-12 text-slate-900 text-center">
              Which Should You Choose?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-purple-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-purple-900">Choose LanaMind If...</h3>
                <ul className="space-y-4">
                  {WHEN_TO_CHOOSE.lanamind.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/register"
                  className="mt-8 block w-full text-center rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 hover:bg-[#EAB308] transition-all"
                >
                  Start Free Trial
                </Link>
              </div>
              
              <div className="bg-slate-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-slate-900">Choose {COMPETITOR_NAME} If...</h3>
                <ul className="space-y-4">
                  {WHEN_TO_CHOOSE.competitor.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href={COMPETITOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 block w-full text-center rounded-full bg-white text-slate-700 font-bold py-4 border-2 border-slate-200 hover:bg-slate-100 transition-all"
                >
                  Visit {COMPETITOR_NAME}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-slate-900 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {[
                {
                  q: `Is LanaMind or ${COMPETITOR_NAME} better for homework help?`,
                  a: `Both platforms offer homework assistance, but LanaMind provides 24/7 instant help while ${COMPETITOR_NAME} [DETAILS]. LanaMind's personalized explanations adapt to your child's understanding level.`
                },
                {
                  q: `Which is more affordable: LanaMind or ${COMPETITOR_NAME}?`,
                  a: `LanaMind starts at $19/month with a free tier available. ${COMPETITOR_NAME} costs $[X]/month [DETAILS]. Over a year, LanaMind families typically save $[AMOUNT].`
                },
                {
                  q: `Can I try both LanaMind and ${COMPETITOR_NAME} for free?`,
                  a: `Yes! LanaMind offers a 14-day free trial with full access. ${COMPETITOR_NAME} offers [DETAILS]. We recommend trying both to see which works better for your child.`
                }
              ].map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-3">{faq.q}</h3>
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Still Deciding?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Try LanaMind free for 14 days. No credit card required. 
              See why 10,000+ families choose us over {COMPETITOR_NAME}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all inline-flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/demo"
                className="rounded-full bg-white/10 text-white border border-white/20 font-bold py-4 px-8 hover:bg-white/20 transition-all inline-block"
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

/*
INSTRUCTIONS FOR USING THIS TEMPLATE:

1. Copy this file to: app/vs-[competitor]/page.tsx
   Examples:
   - app/vs-khanmigo/page.tsx
   - app/vs-synthesis/page.tsx
   - app/vs-albert/page.tsx

2. Update ALL placeholder values marked with [BRACKETS]:
   - [COMPETITOR_NAME] → "Khanmigo"
   - [COMPETITOR_URL] → "https://khanmigo.ai"
   - [X], [Y] → actual pricing
   - [DETAILS] → actual competitor features

3. Research the competitor thoroughly:
   - Visit their website
   - Check pricing page
   - List all features
   - Note limitations
   - Read reviews

4. Be honest and objective:
   - Mention when competitor is better
   - Don't make false claims
   - Focus on real differences
   - Include both pros and cons

5. SEO Benefits:
   - Ranks for "vs" keywords
   - Captures comparison searches
   - Targets bottom-of-funnel users
   - High conversion intent

6. Update sitemap.ts to include new page

Example Competitors to Create:
✓ vs-khanmigo
✓ vs-synthesis-tutor
✓ vs-albert
✓ vs-chegg
✓ vs-wyzant
✓ vs-tutor-com

Each comparison page can drive 100+ organic visits/month!
*/
