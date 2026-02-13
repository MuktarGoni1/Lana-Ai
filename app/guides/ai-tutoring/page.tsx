import { Metadata } from 'next'
import Link from 'next/link'
import { SEO_CONFIG } from '@/lib/seo-config'
import { CheckCircle2, ArrowRight, BookOpen, Users, Lightbulb, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'The Complete Guide to AI Tutoring for Parents (2024)',
  description: 'Everything parents need to know about AI tutoring: how it works, benefits, effectiveness, costs, and how to choose the right platform for your child.',
  keywords: [
    'ai tutoring guide',
    'ai tutor for parents',
    'artificial intelligence tutoring',
    'ai education guide',
    'online tutoring guide',
    'personalized learning ai'
  ],
  openGraph: {
    title: 'Complete Guide to AI Tutoring for Parents',
    description: 'Learn everything about AI tutoring: how it works, benefits, and choosing the right platform.',
    url: 'https://lanamind.com/guides/ai-tutoring',
  },
  alternates: {
    canonical: 'https://lanamind.com/guides/ai-tutoring',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const TABLE_OF_CONTENTS = [
  { id: 'what-is', title: 'What is AI Tutoring?' },
  { id: 'how-it-works', title: 'How Does AI Tutoring Work?' },
  { id: 'benefits', title: 'Benefits of AI Tutoring' },
  { id: 'effectiveness', title: 'Is AI Tutoring Effective?' },
  { id: 'cost', title: 'How Much Does AI Tutoring Cost?' },
  { id: 'vs-human', title: 'AI Tutoring vs Human Tutors' },
  { id: 'choosing', title: 'How to Choose an AI Tutoring Platform' },
  { id: 'faq', title: 'Frequently Asked Questions' },
]

const KEY_TAKEAWAYS = [
  'AI tutoring provides 24/7 personalized learning support that adapts to your child\'s needs',
  'Studies show AI tutoring can improve learning outcomes by 20-30% when used consistently',
  'AI tutoring costs 50-80% less than traditional human tutoring',
  'Best results come from using AI tutoring as a supplement, not replacement, for classroom learning',
  'Look for platforms with adaptive learning, progress tracking, and subject coverage that match your needs'
]

export default function AITutoringGuide() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-grow">
        {/* Hero Section */}
        <article>
          <header className="py-20 bg-gradient-to-b from-purple-50 to-white">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-8">
                <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  Complete Guide
                </span>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 leading-tight">
                  The Complete Guide to{' '}
                  <span className="text-purple-600">AI Tutoring</span>{' '}
                  for Parents
                </h1>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Everything you need to know about AI-powered tutoring: how it works, 
                  benefits, costs, and how to choose the right platform for your child's success.
                </p>
                <div className="flex items-center justify-center gap-4 mt-6 text-sm text-slate-500">
                  <span>⏱️ 15 min read</span>
                  <span>•</span>
                  <span>Updated January 2024</span>
                </div>
              </div>

              {/* Key Takeaways Box */}
              <div className="bg-slate-900 text-white rounded-3xl p-8 max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-[#FACC15]" />
                  Key Takeaways
                </h2>
                <ul className="space-y-3">
                  {KEY_TAKEAWAYS.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#FACC15] flex-shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </header>

          {/* Table of Contents */}
          <nav className="py-12 bg-white border-b border-slate-100">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Table of Contents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TABLE_OF_CONTENTS.map((item, i) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-purple-50 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-700 group-hover:text-purple-700">
                      {item.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </nav>

          {/* Content Sections */}
          <div className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="prose prose-lg max-w-none">
                {/* Section 1: What is AI Tutoring */}
                <section id="what-is" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">What is AI Tutoring?</h2>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    AI tutoring uses artificial intelligence to provide personalized educational support to students. 
                    Unlike traditional tutoring where a human teacher works one-on-one with a student, AI tutoring 
                    platforms like LanaMind use sophisticated algorithms and machine learning to adapt lessons, 
                    explanations, and practice problems to each student's unique needs.
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    Think of it as having a tireless, infinitely patient tutor available 24/7 that remembers 
                    everything about your child's learning journey—from their strongest subjects to the concepts 
                    they struggle with most.
                  </p>
                  
                  <div className="bg-purple-50 rounded-2xl p-6 my-8">
                    <h3 className="font-bold text-slate-900 mb-3">AI Tutoring in Simple Terms:</h3>
                    <ul className="space-y-2 text-slate-700">
                      <li>• Smart computer program that teaches like a human tutor</li>
                      <li>• Adapts to how your child learns best</li>
                      <li>• Available anytime, anywhere</li>
                      <li>• Remembers everything and never gets frustrated</li>
                      <li>• Costs much less than human tutoring</li>
                    </ul>
                  </div>
                </section>

                {/* Section 2: How It Works */}
                <section id="how-it-works" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">How Does AI Tutoring Work?</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
                    {[
                      { step: '1', title: 'Assessment', desc: 'AI evaluates current knowledge and identifies gaps' },
                      { step: '2', title: 'Personalization', desc: 'Creates customized learning path based on results' },
                      { step: '3', title: 'Adaptive Learning', desc: 'Adjusts difficulty in real-time as student progresses' },
                      { step: '4', title: 'Feedback Loop', desc: 'Continuously improves based on performance' }
                    ].map((item) => (
                      <div key={item.step} className="text-center">
                        <div className="w-12 h-12 rounded-full bg-[#FACC15] text-slate-900 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                          {item.step}
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-600">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    When your child interacts with an AI tutor like Lana, the system is constantly analyzing their 
                    responses, measuring response times, tracking which explanations resonate best, and identifying 
                    patterns in their learning. This data feeds into adaptive algorithms that determine:
                  </p>
                  
                  <ul className="space-y-3 text-slate-700 text-lg mb-6">
                    <li>• <strong>What topic to cover next</strong> based on prerequisite knowledge</li>
                    <li>• <strong>How to explain concepts</strong> using your child's preferred learning style</li>
                    <li>• <strong>When to review</strong> material based on spaced repetition science</li>
                    <li>• <strong>Which practice problems</strong> will challenge without frustrating</li>
                  </ul>
                </section>

                {/* Section 3: Benefits */}
                <section id="benefits" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">Benefits of AI Tutoring</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                    {[
                      { icon: Clock, title: '24/7 Availability', desc: 'Learn anytime, anywhere. No scheduling conflicts or waiting for tutor availability.' },
                      { icon: Users, title: 'Personalized Attention', desc: 'One-on-one focus that adapts to your child\'s pace, style, and needs.' },
                      { icon: BookOpen, title: 'Unlimited Practice', desc: 'Generate infinite practice problems tailored to your child\'s level.' },
                      { icon: Lightbulb, title: 'Instant Feedback', desc: 'Immediate answers to questions without waiting for email responses.' }
                    ].map((benefit) => (
                      <div key={benefit.title} className="bg-slate-50 rounded-2xl p-6">
                        <benefit.icon className="h-8 w-8 text-purple-600 mb-4" />
                        <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                        <p className="text-slate-600">{benefit.desc}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Additional Advantages:</h3>
                  <ul className="space-y-3 text-slate-700 text-lg">
                    <li><strong>Cost-effective:</strong> 50-80% less expensive than human tutors</li>
                    <li><strong>Consistent quality:</strong> No bad days or varying teaching quality</li>
                    <li><strong>Safe environment:</strong> No judgment, perfect for shy learners</li>
                    <li><strong>Data-driven insights:</strong> Track progress with detailed analytics</li>
                    <li><strong>Scalable:</strong> Works for one child or an entire classroom</li>
                  </ul>
                </section>

                {/* Section 4: Effectiveness */}
                <section id="effectiveness" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">Is AI Tutoring Effective?</h2>
                  
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8 my-8">
                    <p className="text-2xl font-bold text-slate-900 text-center mb-4">
                      Research shows AI tutoring can improve learning outcomes by 20-30%
                    </p>
                    <p className="text-slate-600 text-center">
                      when used consistently as a supplement to classroom learning
                    </p>
                  </div>

                  <p className="text-slate-600 text-lg leading-relaxed mb-6">
                    Multiple peer-reviewed studies have demonstrated the effectiveness of AI tutoring systems. 
                    A comprehensive study published in the Journal of Educational Psychology found that students 
                    using AI tutoring systems showed significant improvements in:
                  </p>

                  <ul className="space-y-3 text-slate-700 text-lg mb-6">
                    <li>• <strong>Test scores:</strong> Average improvement of 0.76 standard deviations</li>
                    <li>• <strong>Knowledge retention:</strong> Better long-term memory of concepts</li>
                    <li>• <strong>Learning efficiency:</strong> Mastery achieved in 30% less time</li>
                    <li>• <strong>Student confidence:</strong> Increased self-efficacy in challenging subjects</li>
                  </ul>

                  <div className="bg-yellow-50 border-l-4 border-[#FACC15] rounded-r-xl p-6 my-8">
                    <p className="text-slate-700 italic">
                      <strong>Important:</strong> AI tutoring works best as a supplement to—not replacement for—
                      traditional education. The most successful students use AI tutoring for homework help, 
                      concept reinforcement, and extra practice alongside their regular schooling.
                    </p>
                  </div>
                </section>

                {/* Section 5: Cost */}
                <section id="cost" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">How Much Does AI Tutoring Cost?</h2>
                  
                  <div className="overflow-x-auto my-8">
                    <table className="w-full bg-white rounded-2xl shadow-sm border border-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold text-slate-900">Tutoring Type</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-900">Cost per Hour</th>
                          <th className="px-6 py-4 text-left font-bold text-slate-900">Monthly Cost*</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-6 py-4 text-slate-700">Private Human Tutor</td>
                          <td className="px-6 py-4 text-slate-700">$50 - $150</td>
                          <td className="px-6 py-4 text-slate-700">$400 - $1,200</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-slate-700">Tutoring Center</td>
                          <td className="px-6 py-4 text-slate-700">$40 - $80</td>
                          <td className="px-6 py-4 text-slate-700">$320 - $640</td>
                        </tr>
                        <tr className="bg-purple-50">
                          <td className="px-6 py-4 font-bold text-purple-900">AI Tutoring (LanaMind)</td>
                          <td className="px-6 py-4 font-bold text-purple-900">$0.50 - $1.30</td>
                          <td className="px-6 py-4 font-bold text-purple-900">$0 - $39</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-sm text-slate-500 mt-2">*Based on 8 hours of tutoring per month</p>
                  </div>

                  <p className="text-slate-600 text-lg leading-relaxed">
                    AI tutoring is significantly more affordable than traditional options. Many platforms, 
                    including LanaMind, offer free tiers with limited access, allowing families to try before committing.
                  </p>
                </section>

                {/* Section 6: vs Human */}
                <section id="vs-human" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">AI Tutoring vs Human Tutors</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                    <div className="bg-green-50 rounded-2xl p-6">
                      <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6" />
                        AI Tutoring is Better For:
                      </h3>
                      <ul className="space-y-2 text-green-800">
                        <li>• Regular practice and homework help</li>
                        <li>• Building foundational skills</li>
                        <li>• Students who need consistent availability</li>
                        <li>• Cost-conscious families</li>
                        <li>• Shy or anxious learners</li>
                        <li>• Drilling and repetition</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-6">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Human Tutors are Better For:
                      </h3>
                      <ul className="space-y-2 text-blue-800">
                        <li>• Complex concept discussions</li>
                        <li>• Emotional support and motivation</li>
                        <li>• Test-taking strategies</li>
                        <li>• Students needing social interaction</li>
                        <li>• Advanced subject-specific guidance</li>
                        <li>• Accountability and structure</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-slate-600 text-lg leading-relaxed">
                    The best approach? Many families use a hybrid model: AI tutoring for daily practice, 
                    homework help, and skill building, supplemented with occasional human tutoring for 
                    test prep, complex topics, and motivational support.
                  </p>
                </section>

                {/* Section 7: Choosing */}
                <section id="choosing" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">How to Choose an AI Tutoring Platform</h2>
                  
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Key Features to Look For:</h3>
                  
                  <div className="space-y-4 my-8">
                    {[
                      { title: 'Adaptive Learning', desc: 'Platform adjusts difficulty based on student performance' },
                      { title: 'Subject Coverage', desc: 'Comprehensive coverage of subjects your child needs' },
                      { title: 'Progress Tracking', desc: 'Detailed analytics and parent dashboard' },
                      { title: 'Age Appropriateness', desc: 'Content suitable for your child\'s grade level' },
                      { title: 'Safety & Privacy', desc: 'COPPA compliance and data protection' },
                      { title: 'Free Trial', desc: 'Ability to test before committing financially' }
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-4 bg-slate-50 rounded-xl p-4">
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-slate-900">{feature.title}</h4>
                          <p className="text-slate-600">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Questions to Ask:</h3>
                  <ul className="space-y-3 text-slate-700 text-lg mb-6">
                    <li>1. Does it cover the subjects my child needs help with?</li>
                    <li>2. Is it suitable for my child's grade level?</li>
                    <li>3. Can I track my child's progress?</li>
                    <li>4. What do other parents say in reviews?</li>
                    <li>5. Is there a free trial available?</li>
                    <li>6. What's the cancellation policy?</li>
                    <li>7. How does the platform keep my child safe?</li>
                  </ul>
                </section>

                {/* Section 8: FAQ */}
                <section id="faq" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6 text-slate-900">Frequently Asked Questions</h2>
                  
                  <div className="space-y-6">
                    {[
                      { q: 'Can AI tutoring replace teachers?', a: 'No. AI tutoring is designed to supplement, not replace, human teachers and traditional education. It excels at providing extra practice, homework help, and personalized learning paths, but cannot replace the social, emotional, and mentorship aspects of human educators.' },
                      { q: 'How much time should my child spend with AI tutoring?', a: 'For best results, 20-30 minutes per day, 3-5 days per week is recommended. Consistency matters more than duration. Avoid overuse—balance AI tutoring with other activities, social interaction, and unstructured play.' },
                      { q: 'Will AI tutoring work for my child with learning differences?', a: 'Many AI tutoring platforms, including LanaMind, are designed to accommodate different learning styles and paces. The adaptive nature of AI can be particularly beneficial for students with ADHD, dyslexia, or other learning differences. Look for platforms with customizable settings and multiple explanation methods.' },
                      { q: 'How do I know if AI tutoring is working for my child?', a: 'Look for these signs: improved test scores, increased confidence in the subject, willingness to tackle challenging problems, better homework completion, and positive attitude toward learning. Most platforms provide detailed progress reports to track improvement objectively.' }
                    ].map((faq, i) => (
                      <div key={i} className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="font-bold text-slate-900 mb-3">{faq.q}</h3>
                        <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* CTA Section */}
              <div className="bg-slate-900 rounded-3xl p-12 text-center mt-16">
                <h2 className="text-3xl font-bold mb-4 text-white">
                  Ready to Try AI Tutoring?
                </h2>
                <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  Start your child's personalized learning journey with LanaMind. 
                  Free 14-day trial. No credit card required.
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
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
