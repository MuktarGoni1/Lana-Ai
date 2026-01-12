"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { GraduationCap, Lightbulb, BarChart3, Bot, Zap, MoreHorizontal, BookOpen, Calculator, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Link from "next/link";

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
      title: "Learn with term plans", 
      desc: "Structured curriculum planning to guide your child's learning journey systematically.", 
      icon: Calendar 
    },
    { 
      title: "Structured lessons", 
      desc: "Organized, step-by-step learning paths that break down complex topics into digestible parts.", 
      icon: BookOpen 
    },
    { 
      title: "Math tutor", 
      desc: "Expert assistance with step-by-step math problem solving and visual aids.", 
      icon: Calculator 
    },
    { 
      title: "Quick explainer", 
      desc: "Instant clarifications for complex topics that need immediate understanding.", 
      icon: Zap 
    },
    { 
      title: "And more", 
      desc: "Additional educational tools designed for modern learning experiences.", 
      icon: MoreHorizontal 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <Link href="/" className="inline-block text-xl font-bold text-primary">
            Lana AI
          </Link>
        </header>

        <main>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Powerful Features for Personalized Learning
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Lana AI combines cutting-edge technology with proven educational methods to create a learning experience that's both effective and engaging.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="rounded-xl border bg-card bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 dark:hover:shadow-blue-500/30 dark:hover:shadow-xl"
              >
                <feature.icon className="text-primary h-6 w-6 mb-3 dark:text-blue-400 dark:hover:text-blue-300" />
                <h3 className="text-xl font-semibold mb-3 text-foreground leading-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Core Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg mt-1">
                  <Bot className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">AI-Powered Adaptation</h3>
                  <p className="text-muted-foreground">
                    The system adapts to each learner's pace and style, providing personalized content and challenges.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg mt-1">
                  <BarChart3 className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Progress Tracking</h3>
                  <p className="text-muted-foreground">
                    Detailed insights help students, parents, and teachers monitor growth and identify areas for improvement.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg mt-1">
                  <GraduationCap className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Expert Guidance</h3>
                  <p className="text-muted-foreground">
                    Access to AI tutors that provide clear explanations and support for challenging concepts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg mt-1">
                  <Lightbulb className="h-6 w-6 text-primary dark:text-blue-400 dark:hover:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Personalized Learning Paths</h3>
                  <p className="text-muted-foreground">
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
                <Button size="lg" asChild>
                  <Link href="/homepage">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">Start Free Trial</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                </>
              )}
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