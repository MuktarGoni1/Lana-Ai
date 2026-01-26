"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Link from "next/link";

const PLANS = {
  monthly: [
    { name: "Free", price: 0, desc: "Perfect for individual learners", feats: ["Unlimited lessons", "Adaptive AI", "Progress tracking", "Mobile & desktop"] },
    { name: "Family", price: 19, desc: "Connect parent and student", popular: true, feats: ["Up to 2 students", "Parent dashboard", "Real-time reports", "Push notifications"] },
    { name: "Family Plus", price: 29, desc: "For larger families", feats: ["Up to 5 students", "Advanced analytics", "Weekly summaries", "Priority support"] },
  ],
  yearly: [
    { name: "Free", price: 0, desc: "Perfect for individual learners", feats: ["Unlimited lessons", "Adaptive AI", "Progress tracking", "Mobile & desktop"] },
    { name: "Family", price: 15, desc: "Connect parent and student", popular: true, feats: ["Up to 2 students", "Parent dashboard", "Real-time reports", "Push notifications"] },
    { name: "Family Plus", price: 23, desc: "For larger families", feats: ["Up to 5 students", "Advanced analytics", "Weekly summaries", "Priority support"] },
  ],
};

export default function ClientPricingPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { user } = useUnifiedAuth();
  const plans = PLANS[interval];
  const periodLabel = interval === "yearly" ? "/mo (billed yearly)" : "/mo";

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
        <main>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include a 14-day free trial.
            </p>

            <div className="mt-8 inline-flex rounded-full bg-muted p-1" role="tablist" aria-label="Billing frequency">
              <button
                onClick={() => setInterval("monthly")}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ease-in-out ${interval === "monthly" ? "bg-background shadow" : "text-muted-foreground"} hover:bg-accent hover:shadow-lg hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/30 dark:hover:shadow-lg`}
                aria-pressed={interval === "monthly"}
                role="tab"
                aria-selected={interval === "monthly"}
                tabIndex={interval === "monthly" ? 0 : -1}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval("yearly")}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-300 ease-in-out ${interval === "yearly" ? "bg-background shadow" : "text-muted-foreground"} hover:bg-accent hover:shadow-lg hover:scale-105 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:shadow-blue-500/30 dark:hover:shadow-lg`}
                aria-pressed={interval === "yearly"}
                role="tab"
                aria-selected={interval === "yearly"}
                tabIndex={interval === "yearly" ? 0 : -1}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-6xl mx-auto mb-20">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border bg-card bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:-translate-y-2 ${"popular" in plan && plan.popular ? "border-primary shadow-lg" : ""}`}
              >
                {"popular" in plan && plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="space-y-4 mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className="text-muted-foreground">{periodLabel}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.feats.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <svg className="h-5 w-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full"
                  asChild
                >
                  <Link href={user ? (plan.name !== "Free" ? `/checkout?plan=${encodeURIComponent(plan.name)}&interval=${encodeURIComponent(interval)}` : "/homepage") : "/register"}
                    onClick={(e) => {
                      if (user && plan.name !== "Free") {
                        // Add validation to ensure plan is valid before redirecting
                        const allowedPlans = ['Family', 'Family Plus'];
                        if (allowedPlans.includes(plan.name)) {
                          e.preventDefault();
                          window.location.href = `/checkout?plan=${encodeURIComponent(plan.name)}&interval=${encodeURIComponent(interval)}`;
                        }
                      }
                    }}
                    >
                    {user ? (plan.name !== "Free" ? "Upgrade Now" : "Manage Subscription") : "Get Started"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border mb-16">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground">Can I change plans anytime?</h3>
                <p className="text-muted-foreground mt-1">Yes, you can upgrade, downgrade, or cancel your subscription at any time.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Is there a free trial available?</h3>
                <p className="text-muted-foreground mt-1">All paid plans include a 14-day free trial so you can explore all features risk-free.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">What payment methods do you accept?</h3>
                <p className="text-muted-foreground mt-1">We accept all major credit cards including Visa, Mastercard, and American Express.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Can I get a refund?</h3>
                <p className="text-muted-foreground mt-1">Yes, we offer a 30-day money-back guarantee on all paid subscriptions.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Start Your Learning Journey Today</h2>
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