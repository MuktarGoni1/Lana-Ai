import { Metadata } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'
import { serializeJsonLd } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | LanaMind AI Tutoring',
  description: 'Find answers to common questions about LanaMind AI tutoring platform, pricing, features, subjects, and how our personalized learning works.',
  keywords: [
    'ai tutoring faq',
    'lanamind questions',
    'online tutoring help',
    'ai tutor pricing',
    'personalized learning faq',
    'ai education questions'
  ],
  openGraph: {
    title: 'LanaMind FAQ - Your Questions Answered',
    description: 'Everything you need to know about LanaMind AI tutoring platform.',
    url: 'https://lanamind.com/faq',
  },
  alternates: {
    canonical: 'https://lanamind.com/faq',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// FAQ structured data for GEO (Generative Engine Optimization)
const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is AI tutoring and how does it work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI tutoring uses artificial intelligence to provide personalized educational support. LanaMind\'s AI tutor, Lana, adapts to each student\'s learning style, pace, and needs. The system analyzes student responses, identifies knowledge gaps, and delivers customized lessons, explanations, and practice problems. Unlike traditional tutoring, AI tutoring is available 24/7 and provides instant feedback.'
      }
    },
    {
      '@type': 'Question',
      name: 'How much does LanaMind cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'LanaMind offers three pricing tiers: Free (5 lessons/month), Family ($19/month with unlimited lessons and parent dashboard), and Family Plus ($39/month with multiple student profiles and 1-on-1 sessions). All paid plans include a 14-day free trial. Annual billing offers up to 25% savings.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is AI tutoring effective compared to human tutors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI tutoring can be highly effective, especially for supplementing classroom learning and providing consistent practice. Studies show that personalized AI tutoring can improve learning outcomes by up to 30%. While it doesn\'t replace human connection, AI tutors offer advantages like 24/7 availability, infinite patience, instant feedback, and consistent quality. Many families use AI tutoring alongside occasional human tutoring for the best results.'
      }
    },
    {
      '@type': 'Question',
      name: 'What subjects does LanaMind cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'LanaMind covers core academic subjects including Mathematics (arithmetic, algebra, geometry, calculus), Science (biology, chemistry, physics), English/Language Arts (reading, writing, grammar), and History/Social Studies. We also offer specialized support for test preparation, homework help, and skill-building across all K-12 grade levels.'
      }
    },
    {
      '@type': 'Question',
      name: 'How does LanaMind personalize learning for my child?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'LanaMind personalizes learning through several methods: (1) Diagnostic assessment to identify strengths and weaknesses, (2) Adaptive algorithms that adjust difficulty based on performance, (3) Learning style detection (visual, auditory, kinesthetic), (4) Pace customization that spends more time on challenging topics, (5) Interest-based content to increase engagement, and (6) Continuous progress monitoring to update the learning path.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I track my child\'s progress?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! LanaMind provides a comprehensive parent dashboard where you can monitor your child\'s progress in real-time. Track metrics include: lessons completed, time spent learning, skills mastered, areas needing improvement, quiz scores, learning streaks, and personalized recommendations. You\'ll also receive weekly progress reports via email.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is LanaMind safe for children?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. LanaMind is COPPA-compliant and designed with child safety as a priority. We use content filtering to ensure age-appropriate material, encrypted data transmission, secure account protection, and strict privacy policies. No personal information is shared with third parties, and parents have full control over their child\'s account and learning experience.'
      }
    },
    {
      '@type': 'Question',
      name: 'What age groups is LanaMind suitable for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'LanaMind is designed for students from kindergarten through 12th grade (ages 5-18). Our AI adapts content complexity, explanations, and examples to be age-appropriate. We also offer specialized support for early learners (K-2) with visual aids and interactive elements, as well as advanced content for high school students preparing for college.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my subscription anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can cancel your subscription at any time with no cancellation fees. If you cancel, you\'ll continue to have access until the end of your current billing period. We also offer a 30-day money-back guarantee for new subscribers who are not satisfied with the service.'
      }
    },
    {
      '@type': 'Question',
      name: 'How is LanaMind different from Khan Academy or other free resources?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'While Khan Academy offers excellent video content, LanaMind provides interactive, conversational AI tutoring that adapts in real-time to your child\'s responses. Key differences include: (1) Personalized learning paths vs. fixed curriculum, (2) Interactive dialogue vs. passive video watching, (3) Instant answers to specific questions, (4) Parent progress dashboard, (5) Automated revision reminders, and (6) AI that remembers your child\'s learning history and preferences.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you offer a free trial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! We offer a 14-day free trial for all paid plans. No credit card is required to start. During the trial, you\'ll have full access to all features including unlimited lessons, parent dashboard, and progress tracking. At the end of the trial, you can choose to subscribe or continue with our free plan (5 lessons/month).'
      }
    },
    {
      '@type': 'Question',
      name: 'Can LanaMind help with homework?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, LanaMind is excellent for homework help! Students can ask specific questions about their assignments, get step-by-step explanations, and receive guidance without getting the direct answer (to ensure learning). Our "Quick Mode" is specifically designed for homework support, providing fast, clear explanations for any topic.'
      }
    }
  ]
}

const FAQ_CATEGORIES = [
  {
    title: 'Getting Started',
    questions: [
      {
        q: 'What is AI tutoring and how does it work?',
        a: 'AI tutoring uses artificial intelligence to provide personalized educational support. LanaMind\'s AI tutor, Lana, adapts to each student\'s learning style, pace, and needs. The system analyzes student responses, identifies knowledge gaps, and delivers customized lessons, explanations, and practice problems. Unlike traditional tutoring, AI tutoring is available 24/7 and provides instant feedback.'
      },
      {
        q: 'What age groups is LanaMind suitable for?',
        a: 'LanaMind is designed for students from kindergarten through 12th grade (ages 5-18). Our AI adapts content complexity, explanations, and examples to be age-appropriate. We also offer specialized support for early learners (K-2) with visual aids and interactive elements, as well as advanced content for high school students preparing for college.'
      },
      {
        q: 'Do you offer a free trial?',
        a: 'Yes! We offer a 14-day free trial for all paid plans. No credit card is required to start. During the trial, you\'ll have full access to all features including unlimited lessons, parent dashboard, and progress tracking. At the end of the trial, you can choose to subscribe or continue with our free plan (5 lessons/month).'
      }
    ]
  },
  {
    title: 'Pricing & Plans',
    questions: [
      {
        q: 'How much does LanaMind cost?',
        a: 'LanaMind offers three pricing tiers: Free (5 lessons/month), Family ($19/month with unlimited lessons and parent dashboard), and Family Plus ($39/month with multiple student profiles and 1-on-1 sessions). All paid plans include a 14-day free trial. Annual billing offers up to 25% savings.'
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes, you can cancel your subscription at any time with no cancellation fees. If you cancel, you\'ll continue to have access until the end of your current billing period. We also offer a 30-day money-back guarantee for new subscribers who are not satisfied with the service.'
      }
    ]
  },
  {
    title: 'Features & Learning',
    questions: [
      {
        q: 'What subjects does LanaMind cover?',
        a: 'LanaMind covers core academic subjects including Mathematics (arithmetic, algebra, geometry, calculus), Science (biology, chemistry, physics), English/Language Arts (reading, writing, grammar), and History/Social Studies. We also offer specialized support for test preparation, homework help, and skill-building across all K-12 grade levels.'
      },
      {
        q: 'How does LanaMind personalize learning for my child?',
        a: 'LanaMind personalizes learning through several methods: (1) Diagnostic assessment to identify strengths and weaknesses, (2) Adaptive algorithms that adjust difficulty based on performance, (3) Learning style detection (visual, auditory, kinesthetic), (4) Pace customization that spends more time on challenging topics, (5) Interest-based content to increase engagement, and (6) Continuous progress monitoring to update the learning path.'
      },
      {
        q: 'Can I track my child\'s progress?',
        a: 'Yes! LanaMind provides a comprehensive parent dashboard where you can monitor your child\'s progress in real-time. Track metrics include: lessons completed, time spent learning, skills mastered, areas needing improvement, quiz scores, learning streaks, and personalized recommendations. You\'ll also receive weekly progress reports via email.'
      },
      {
        q: 'Can LanaMind help with homework?',
        a: 'Yes, LanaMind is excellent for homework help! Students can ask specific questions about their assignments, get step-by-step explanations, and receive guidance without getting the direct answer (to ensure learning). Our "Quick Mode" is specifically designed for homework support, providing fast, clear explanations for any topic.'
      }
    ]
  },
  {
    title: 'Safety & Comparison',
    questions: [
      {
        q: 'Is LanaMind safe for children?',
        a: 'Absolutely. LanaMind is COPPA-compliant and designed with child safety as a priority. We use content filtering to ensure age-appropriate material, encrypted data transmission, secure account protection, and strict privacy policies. No personal information is shared with third parties, and parents have full control over their child\'s account and learning experience.'
      },
      {
        q: 'Is AI tutoring effective compared to human tutors?',
        a: 'AI tutoring can be highly effective, especially for supplementing classroom learning and providing consistent practice. Studies show that personalized AI tutoring can improve learning outcomes by up to 30%. While it doesn\'t replace human connection, AI tutors offer advantages like 24/7 availability, infinite patience, instant feedback, and consistent quality. Many families use AI tutoring alongside occasional human tutoring for the best results.'
      },
      {
        q: 'How is LanaMind different from Khan Academy or other free resources?',
        a: 'While Khan Academy offers excellent video content, LanaMind provides interactive, conversational AI tutoring that adapts in real-time to your child\'s responses. Key differences include: (1) Personalized learning paths vs. fixed curriculum, (2) Interactive dialogue vs. passive video watching, (3) Instant answers to specific questions, (4) Parent progress dashboard, (5) Automated revision reminders, and (6) AI that remembers your child\'s learning history and preferences.'
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <>
      {/* FAQ Structured Data for AI Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(faqStructuredData)
        }}
      />
      
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">
                Frequently Asked <span className="text-purple-600">Questions</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Everything you need to know about LanaMind AI tutoring. 
                Can't find what you're looking for? Contact our support team.
              </p>
            </div>
          </section>

          {/* FAQ Categories */}
          <section className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
              {FAQ_CATEGORIES.map((category, categoryIndex) => (
                <div key={category.title} className="mb-16">
                  <h2 className="text-3xl font-bold mb-8 text-slate-900">
                    {category.title}
                  </h2>
                  <div className="space-y-6">
                    {category.questions.map((faq, faqIndex) => (
                      <div 
                        key={faqIndex}
                        className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all"
                      >
                        <h3 className="text-xl font-bold mb-4 text-slate-900">
                          {faq.q}
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Still Have Questions */}
          <section className="py-20 bg-slate-900 text-white">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Still Have Questions?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Our team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:contact@lanamind.com"
                  className="rounded-full bg-[#FACC15] text-slate-900 font-bold py-4 px-8 hover:bg-[#EAB308] transition-all inline-block"
                >
                  Email Us
                </a>
                <a 
                  href="/contact"
                  className="rounded-full bg-white/10 text-white border border-white/20 font-bold py-4 px-8 hover:bg-white/20 transition-all inline-block"
                >
                  Contact Form
                </a>
              </div>
            </div>
          </section>

          {/* Related Questions for GEO */}
          <section className="py-16 bg-slate-50">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-bold mb-8 text-slate-900 text-center">
                People Also Ask
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'What is the best AI tutoring platform?',
                  'Can AI tutors replace human teachers?',
                  'How do I choose an online tutor for my child?',
                  'What are the benefits of personalized learning?',
                  'Is online tutoring worth it?',
                  'How much should I pay for a tutor?'
                ].map((question, i) => (
                  <a
                    key={i}
                    href="https://www.google.com/search?q=lanamind+ai+tutoring"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-700 font-medium"
                  >
                    {question}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}
