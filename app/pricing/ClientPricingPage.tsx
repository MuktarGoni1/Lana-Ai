"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Link from "next/link";
import Script from "next/script";
import { Header, Footer } from "@/components/navigation";
import { PRICING_CONFIG, getPlanPrice, getPlanFeatures, getPlanDescription } from "@/lib/pricing-config";
import { validatePlanSelection, getPlanRedirectUrl, isAllowedPlan } from "@/lib/pricing-validation";
import { useRouter } from "next/navigation";
import { getChildFriendlyClasses } from "@/lib/ui-styles";
import { serializeJsonLd } from "@/lib/structured-data";
import { pricingStructuredData } from "./metadata";

// Using centralized pricing configuration
const getPlansForInterval = (interval: "monthly" | "yearly") => {
  return Object.entries(PRICING_CONFIG.plans).map(([name, plan]) => ({
    name,
    price: plan[interval],
    desc: plan.description,
    feats: plan.features,
    popular: name === "Family" // Mark Family as popular
  }));
};

const PLANS = {
  monthly: getPlansForInterval("monthly"),
  yearly: getPlansForInterval("yearly")
};

export default function ClientPricingPage() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { user } = useUnifiedAuth();
  const router = useRouter();
  const plans = PLANS[interval];
  const periodLabel = interval === "yearly" ? "/mo (billed yearly)" : "/mo";

  const handlePlanClick = (planName: string) => {
    if (!user) {
      router.push('/register');
      return;
    }

    // Validate plan selection
    const validation = validatePlanSelection(planName, interval);
    if (!validation.isValid) {
      console.error('Invalid plan selection:', validation.errors);
      return;
    }

    // Get secure redirect URL
    const redirectUrl = getPlanRedirectUrl(
      planName as any, 
      interval, 
      !!user
    );
    
    router.push(redirectUrl);
  };

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
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include a 14-day free trial.
            </p>

            <div className="mt-8 inline-flex rounded-full bg-slate-100 p-1 border border-slate-200" role="tablist" aria-label="Billing frequency">
              <button
                onClick={() => setInterval("monthly")}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${interval === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                aria-pressed={interval === "monthly"}
                role="tab"
                aria-selected={interval === "monthly"}
                tabIndex={interval === "monthly" ? 0 : -1}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval("yearly")}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${interval === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
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
                className={`rounded-3xl p-8 transition-all duration-300 ${"popular" in plan && plan.popular ? "bg-slate-900 text-white shadow-2xl scale-105 transform z-10" : "bg-white text-slate-900 border border-slate-200 shadow-sm"}`}
              >
                {"popular" in plan && plan.popular && (
                  <div className="text-center mb-4">
                    <span className="inline-block bg-[#FACC15] text-slate-900 text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="space-y-4 mb-6">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">${plan.price}</span>
                    <span className={`text-sm ${"popular" in plan && plan.popular ? "text-slate-400" : "text-slate-500"}`}>{periodLabel}</span>
                  </div>
                  <p className={`font-medium ${"popular" in plan && plan.popular ? "text-slate-300" : "text-slate-600"}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.feats.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <svg className={`h-5 w-5 flex-shrink-0 ${"popular" in plan && plan.popular ? "text-yellow-400" : "text-green-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`w-full block text-center py-4 rounded-full font-bold transition-all ${"popular" in plan && plan.popular ? "bg-[#FACC15] text-slate-900 hover:bg-[#EAB308]" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}
                >
                  {user ? (plan.name !== "Free" ? "Upgrade Now" : "Manage Subscription") : "Get Started"}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-3xl p-12 shadow-sm border border-slate-100 mb-16">
            <h2 className="text-2xl font-bold mb-8 text-slate-900 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900">Can I change plans anytime?</h3>
                <p className="text-slate-600 mt-2 font-medium">Yes, you can upgrade, downgrade, or cancel your subscription at any time.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Is there a free trial available?</h3>
                <p className="text-slate-600 mt-2 font-medium">All paid plans include a 14-day free trial so you can explore all features risk-free.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">What payment methods do you accept?</h3>
                <p className="text-slate-600 mt-2 font-medium">We accept all major credit cards including Visa, Mastercard, and American Express.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Can I get a refund?</h3>
                <p className="text-slate-600 mt-2 font-medium">Yes, we offer a 30-day money-back guarantee on all paid subscriptions.</p>
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
      {/* Structured Data for Pricing Plans */}
      {pricingStructuredData.map((schema, index) => (
        <Script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(schema)
          }}
        />
      ))}
    </div>
  );
}