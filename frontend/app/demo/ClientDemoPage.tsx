"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext';
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ClientDemoPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useComprehensiveAuth();

  useEffect(() => { 
    setMounted(true); 
    setTheme("light");
  }, []);

  if (!mounted) { 
    return <div className="min-h-screen bg-background text-foreground"></div>; 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <Link href="/" className="inline-block text-xl font-bold text-primary">
            Lana AI
          </Link>
        </header>

        <main className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Experience Lana AI Live
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            See how our personalized AI tutoring transforms the learning experience for students and keeps parents connected to their child's progress.
          </p>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Schedule Your Demo</h2>
            <p className="text-muted-foreground mb-6">
              Fill out the form below and our team will reach out to schedule a personalized demonstration of Lana AI.
            </p>
            
            <div className="space-y-4">
              <div className="text-left">
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="text-left">
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="text-left">
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                  Role
                </label>
                <select
                  id="role"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select your role</option>
                  <option value="parent">Parent</option>
                  <option value="educator">Educator</option>
                  <option value="student">Student</option>
                  <option value="administrator">School Administrator</option>
                </select>
              </div>
              
              <Button className="w-full md:w-auto px-6 py-3 mt-4">
                Request Demo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-2 text-foreground">Personalized Learning</h3>
              <p className="text-muted-foreground text-sm">
                Experience how Lana AI adapts to each student's unique learning style.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-2 text-foreground">Real-time Progress</h3>
              <p className="text-muted-foreground text-sm">
                See how parents stay connected to their child's educational journey.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-lg mb-2 text-foreground">AI-Powered Tutoring</h3>
              <p className="text-muted-foreground text-sm">
                Discover the advanced AI technology that powers our tutoring system.
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lana AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}