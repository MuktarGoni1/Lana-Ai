"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Users, GraduationCap, Lightbulb, Bot, BarChart3, Globe } from "lucide-react";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses, getPastelBg } from "@/lib/ui-styles";

/* ---------- ABOUT CONTENT ---------- */
function AboutContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Lana AI</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Revolutionizing education through artificial intelligence. We're on a mission to make personalized learning accessible to every child and family worldwide.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
              Our Story
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2023, Lana AI began with a simple vision: to bridge the gap between traditional education and the digital age. We recognized that every child learns differently and at their own pace, yet traditional classroom settings often struggle to accommodate these individual differences.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our team of educators, technologists, and parents came together to create an AI-powered learning companion that adapts to each child's unique learning style, keeping parents connected to their child's educational journey every step of the way.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, thousands of families trust Lana AI to help their children learn, grow, and succeed in an increasingly complex world.
            </p>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
              Our Mission
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed font-medium">
              To empower every child with personalized AI tutoring that adapts to their unique learning style, while keeping parents connected to their child's progress and educational journey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <GraduationCap className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Personalized Learning</h3>
                  <p className="text-slate-600 text-sm font-medium">Tailored education for each child's unique needs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Globe className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Global Access</h3>
                  <p className="text-slate-600 text-sm font-medium">Making quality education accessible worldwide</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Users className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Family Connection</h3>
                  <p className="text-slate-600 text-sm font-medium">Keeping parents engaged in their child's learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8 md:mb-12 flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
            How We Transform Learning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`rounded-3xl p-8 text-center border border-slate-100 ${getPastelBg(0)}`}>
              <div className="bg-white p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Bot className="h-6 w-6 text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">AI-Powered Tutoring</h3>
              <p className="text-slate-600 text-sm font-medium">
                Advanced AI that explains concepts in ways that make sense to each individual child
              </p>
            </div>
            <div className={`rounded-3xl p-8 text-center border border-slate-100 ${getPastelBg(1)}`}>
              <div className="bg-white p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <BarChart3 className="h-6 w-6 text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Progress Tracking</h3>
              <p className="text-slate-600 text-sm font-medium">
                Detailed insights that help parents and educators monitor growth and identify areas for improvement
              </p>
            </div>
            <div className={`rounded-3xl p-8 text-center border border-slate-100 ${getPastelBg(2)}`}>
              <div className="bg-white p-3 rounded-xl w-12 h-12 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Lightbulb className="h-6 w-6 text-slate-900" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Adaptive Learning</h3>
              <p className="text-slate-600 text-sm font-medium">
                Content that adjusts to each child's pace and learning style for optimal comprehension
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-3xl p-12 md:p-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FACC15]"></span>
              Join Our Community
            </h2>
            <p className="text-slate-600 mb-8 font-medium">
              Become part of a growing community of families who are transforming education through technology. Together, we're shaping the future of learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className={getChildFriendlyClasses.button}
              >
                Get Started
              </Link>
              <Link 
                href="/contact" 
                className={getChildFriendlyClasses.buttonSecondary}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientAboutPage() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); setTheme("light") }, [])
  if (!mounted) { return null }

  return (
    <div className="flex min-h-screen flex-col bg-white text-foreground font-sans selection:bg-yellow-200">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      
      <Header />
      <main id="main-content" className="flex-grow">
        <AboutContent />
      </main>
      <Footer />
    </div>
  )
}