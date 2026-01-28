"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses } from "@/lib/ui-styles";

/* ---------- PRIVACY POLICY CONTENT ---------- */
function PrivacyPolicyContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm md:text-base">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Welcome to LanaMind's Privacy Policy. We care about your privacy and want you to understand how we handle your information. This policy explains what data we collect, why we need it, and how we protect it when you use our website www.lanamind.com.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            What Information We Collect
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            Here's what we collect and why:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li><span className="font-bold text-slate-900">Your Account Info:</span> Your name and email address when you create an account</li>
            <li><span className="font-bold text-slate-900">Technical Details:</span> Basic information like your device type and browser to help us improve our service</li>
            <li><span className="font-bold text-slate-900">Payment Info:</span> Billing details when you subscribe to our service</li>
            <li><span className="font-bold text-slate-900">Optional Social Data:</span> If you connect your social accounts, we'll access basic profile information</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            How We Use Your Information
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            We use your information to:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li>Set up and manage your account</li>
            <li>Help you log in and access your learning materials</li>
            <li>Provide support when you need help</li>
            <li>Send important updates about your account</li>
            <li>Improve our service based on how you use it</li>
            <li>Process your payments and send receipts</li>
            <li>Share helpful tips about learning (you can opt out)</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            When We Share Your Information
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            We only share your information in these situations:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li><span className="font-bold text-slate-900">Legal Requirements:</span> When required by law or to protect safety</li>
            <li><span className="font-bold text-slate-900">Service Providers:</span> With trusted partners who help us run our service (like payment processors)</li>
            <li><span className="font-bold text-slate-900">Your Consent:</span> When you agree to receive helpful learning tips</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Keeping Your Information Safe
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            We take security seriously and use industry-standard measures to protect your information. While no system is 100% secure, we work hard to keep your data safe and private.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            For Families with Children
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Our service is designed for children 13 and older. If you're a parent and discover we've collected information from a child under 13 without your permission, please contact us immediately and we'll delete it right away.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Updates to This Policy
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            We may update this policy when needed. If we make important changes, we'll post the new version on our website. We recommend checking back occasionally to stay informed.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Questions?
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            If you have any questions about this policy, we're happy to help:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 font-medium">
            <li>Email us: <a href="mailto:contact@lanamind.com" className="text-slate-900 hover:underline font-bold">contact@lanamind.com</a></li>
            <li>Visit our <a href="/contact" className="text-slate-900 hover:underline font-bold">Contact page</a></li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientPrivacyPage() {
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
        <PrivacyPolicyContent />
      </main>
      <Footer />
    </div>
  )
}