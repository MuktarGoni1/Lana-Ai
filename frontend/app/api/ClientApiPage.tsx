"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Bot, Zap, BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ClientApiPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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

        <main className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Lana AI API Platform
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Integrate the power of personalized AI tutoring into your applications with our comprehensive API suite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Easy Integration</h2>
              </div>
              <p className="text-muted-foreground">
                Simple RESTful APIs with comprehensive documentation to get you started in minutes.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Secure Access</h2>
              </div>
              <p className="text-muted-foreground">
                Enterprise-grade security with OAuth 2.0 and rate limiting to protect your data.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">AI Capabilities</h2>
              </div>
              <p className="text-muted-foreground">
                Access to our advanced AI models for personalized learning recommendations and tutoring.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
              </div>
              <p className="text-muted-foreground">
                Detailed analytics and reporting on learning progress and engagement metrics.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Getting Started</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>Create an account to get your API key</li>
                <li>Review our comprehensive documentation</li>
                <li>Start integrating with our sample code snippets</li>
                <li>Test your integration in our sandbox environment</li>
                <li>Go live with your application</li>
              </ol>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4">
              <Button variant="default">
                <Link href="/register">Get API Key</Link>
              </Button>
              <Button variant="outline">
                <Link href="#">View Documentation</Link>
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">API Endpoints</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-foreground">Endpoint</th>
                    <th className="text-left py-3 text-foreground">Description</th>
                    <th className="text-left py-3 text-foreground">Authentication</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 font-mono text-sm text-primary">GET /api/v1/lessons</td>
                    <td className="py-3 text-muted-foreground">Retrieve personalized lessons for a student</td>
                    <td className="py-3 text-muted-foreground">Required</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 font-mono text-sm text-primary">POST /api/v1/tutor</td>
                    <td className="py-3 text-muted-foreground">Submit questions to the AI tutor</td>
                    <td className="py-3 text-muted-foreground">Required</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 font-mono text-sm text-primary">GET /api/v1/progress</td>
                    <td className="py-3 text-muted-foreground">Get student progress and analytics</td>
                    <td className="py-3 text-muted-foreground">Required</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono text-sm text-primary">POST /api/v1/feedback</td>
                    <td className="py-3 text-muted-foreground">Submit feedback on tutoring sessions</td>
                    <td className="py-3 text-muted-foreground">Required</td>
                  </tr>
                </tbody>
              </table>
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