"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TestimonialsPage() {
  const [testimonials] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Parent",
      content: "Lana AI has transformed how my child learns. The personalized approach and real-time progress reports give me confidence in their education.",
      rating: 5
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Student",
      content: "The AI tutor explains concepts in ways that finally make sense to me. I've improved my grades significantly since using Lana.",
      rating: 5
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Teacher",
      content: "As an educator, I appreciate how Lana complements traditional teaching methods. It's a valuable tool for differentiated instruction.",
      rating: 4
    }
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-stone-200 to-gray-300 dark:from-gray-800/30 dark:via-stone-800/30 dark:to-gray-800/30">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            What Our Users Say
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from parents, students, and educators who have experienced the transformative power of personalized AI learning.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 rounded-xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-3">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-gray-300">★</span>
                  ))}
                </div>
              </div>
              
              <p className="text-foreground/90 leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-card bg-gradient-to-br from-gray-100 to-stone-200 dark:from-gray-800/40 dark:to-stone-800/40 rounded-xl p-8 max-w-2xl mx-auto border">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-muted-foreground mb-6">
              Experience the difference personalized AI learning can make in your educational journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
              <Link 
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-6 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}