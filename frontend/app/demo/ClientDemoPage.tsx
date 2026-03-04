"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Link from "next/link";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses } from "@/lib/ui-styles";

export default function ClientDemoPage() {
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
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Experience Lana AI Live
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              See how our personalized AI tutoring transforms the learning experience for students and keeps parents connected to their child's progress.
            </p>

            <div className="bg-slate-50 rounded-3xl p-12 shadow-sm border border-slate-100 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Schedule Your Demo</h2>
              <p className="text-slate-600 mb-8 font-medium">
                Fill out the form below and our team will reach out to schedule a personalized demonstration of Lana AI.
              </p>
              
              <div className="space-y-6">
                <div className="text-left">
                  <label htmlFor="name" className="block text-sm font-bold text-slate-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="text-left">
                  <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="text-left">
                  <label htmlFor="role" className="block text-sm font-bold text-slate-900 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select your role</option>
                    <option value="parent">Parent</option>
                    <option value="educator">Educator</option>
                    <option value="student">Student</option>
                    <option value="administrator">School Administrator</option>
                  </select>
                </div>
                
                <button className={getChildFriendlyClasses.button}>
                  Request Demo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="font-bold text-xl mb-3 text-slate-900">Personalized Learning</h3>
                <p className="text-slate-600 font-medium">
                  Experience how Lana AI adapts to each student's unique learning style.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="font-bold text-xl mb-3 text-slate-900">Real-time Progress</h3>
                <p className="text-slate-600 font-medium">
                  See how parents stay connected to their child's educational journey.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="font-bold text-xl mb-3 text-slate-900">AI-Powered Tutoring</h3>
                <p className="text-slate-600 font-medium">
                  Discover the advanced AI technology that powers our tutoring system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}