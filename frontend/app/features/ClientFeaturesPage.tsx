"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { GraduationCap, Lightbulb, BarChart3, Bot, Zap, MoreHorizontal, BookOpen, Calculator, Calendar, CheckCircle, Users, Trophy, Star } from "lucide-react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Link from "next/link";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses, getPastelBg } from "@/lib/ui-styles";

export default function ClientFeaturesPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useUnifiedAuth();

  useEffect(() => { 
    setMounted(true); 
    setTheme("light");
  }, []);

  if (!mounted) { 
    return <div className="min-h-screen bg-background text-foreground"></div>; 
  }

  const features = [
    { 
      title: "Learn with Term Plans", 
      desc: "Structured curriculum planning to guide your child's learning journey systematically with age-appropriate content.", 
      icon: Calendar 
    },
    { 
      title: "Structured Lessons", 
      desc: "Organized, step-by-step learning paths that break down complex topics into digestible parts for better understanding.", 
      icon: BookOpen 
    },
    { 
      title: "Math Tutor", 
      desc: "Expert assistance with step-by-step math problem solving and visual aids tailored to your child's learning level.", 
      icon: Calculator 
    },
    { 
      title: "Quick Explainer", 
      desc: "Instant clarifications for complex topics that need immediate understanding with personalized explanations.", 
      icon: Zap 
    },
    { 
      title: "Avatar-Based Learning", 
      desc: "Engaging learning experience with personalized avatars that make education fun and interactive.", 
      icon: Users 
    },
    { 
      title: "Performance Reporting", 
      desc: "Detailed progress tracking and reports for parents to stay connected with their child's learning journey.", 
      icon: BarChart3 
    },
    { 
      title: "Automated Revision", 
      desc: "Smart reminders and spaced repetition to help reinforce learning and improve retention.", 
      icon: Trophy 
    },
    { 
      title: "Explanatory Videos", 
      desc: "High-quality educational videos that bring concepts to life and make learning more engaging.", 
      icon: Star 
    },
  ];

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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Powerful Features for Personalized Learning
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Lana AI combines cutting-edge technology with proven educational methods to create a learning experience that's both effective and engaging.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mb-20">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className={`rounded-3xl p-8 border border-slate-100 transition-all duration-300 transform hover:scale-105 overflow-hidden hover:shadow-2xl shadow ${getPastelBg(index)} bg-contain flex flex-col h-[360px]`}              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <feature.icon className="text-slate-900 h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-3xl p-12 shadow-sm border border-slate-100 mb-16">
            <h2 className="text-2xl font-bold mb-8 text-slate-900 text-center">Core Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Bot className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">AI-Powered Adaptation</h3>
                  <p className="text-slate-600 font-medium">
                    The system adapts to each learner's pace and style, providing personalized content and challenges.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <BarChart3 className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Progress Tracking</h3>
                  <p className="text-slate-600 font-medium">
                    Detailed insights help students, parents, and teachers monitor growth and identify areas for improvement.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <GraduationCap className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Expert Guidance</h3>
                  <p className="text-slate-600 font-medium">
                    Access to AI tutors that provide clear explanations and support for challenging concepts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Lightbulb className="h-6 w-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">Personalized Learning Paths</h3>
                  <p className="text-slate-600 font-medium">
                    Customized curricula that evolve based on the student's strengths, weaknesses, and interests.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Ready to Transform Learning?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of families who trust Lana AI to help their children learn, grow, and succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/homepage" className={getChildFriendlyClasses.button}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className={getChildFriendlyClasses.button}>
                    Start Free Trial
                  </Link>
                  <Link href="/login" className={getChildFriendlyClasses.buttonSecondary}>
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}