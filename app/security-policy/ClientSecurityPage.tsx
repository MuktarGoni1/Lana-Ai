"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { Shield, Lock, Eye, FileText } from "lucide-react";
import { Header, Footer } from "@/components/navigation";
import { getChildFriendlyClasses } from "@/lib/ui-styles";

/* ---------- SECURITY POLICY CONTENT ---------- */
function SecurityPolicyContent() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Security Policy</h1>
          <p className="text-muted-foreground text-sm md:text-base">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            At Lana AI, we take your security seriously. This policy explains how we protect your information and keep your account safe.
          </p>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            How We Protect Your Data
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            We use several security measures to keep your information safe:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li><span className="font-bold text-slate-900">Encryption:</span> All data between your device and our servers is encrypted</li>
            <li><span className="font-bold text-slate-900">Secure Storage:</span> Your personal information is stored on secure servers with limited access</li>
            <li><span className="font-bold text-slate-900">Regular Checks:</span> We audit our systems regularly to find and fix any security issues</li>
            <li><span className="font-bold text-slate-900">Access Controls:</span> Only authorized staff can access sensitive data</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Keeping Your Account Safe
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            We protect your account with multiple layers of security:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li><span className="font-bold text-slate-900">Password Protection:</span> All passwords are encrypted using strong security methods</li>
            <li><span className="font-bold text-slate-900">Two-Factor Authentication:</span> Add extra security to your account (optional)</li>
            <li><span className="font-bold text-slate-900">Session Management:</span> Secure login sessions that expire automatically</li>
            <li><span className="font-bold text-slate-900">Activity Monitoring:</span> We watch for suspicious activity and alert you if needed</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Your Data Rights
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            You have control over your personal data:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li>Access, update, or delete your information anytime through your account settings</li>
            <li>We clearly explain what data we collect and how we use it</li>
            <li>You can opt out of certain data collection where allowed by law</li>
            <li>We follow privacy laws like GDPR and CCPA</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            If There's a Security Issue
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            If something goes wrong:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li>We have a plan to respond quickly and contain any security problems</li>
            <li>We'll notify you within 72 hours if your personal information is affected</li>
            <li>We review what happened to prevent it from happening again</li>
            <li>We have insurance to cover cybersecurity incidents</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Our Security Culture
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            Security is everyone's job at Lana AI:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li>All employees get security training when they start and every year after</li>
            <li>Staff sign agreements to keep your information private</li>
            <li>Only people who need access to sensitive data get it</li>
            <li>We update our security practices based on new threats and best practices</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Working with Partners
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            We carefully choose our partners:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 mb-8 font-medium">
            <li>All partners must meet our security standards and sign data protection agreements</li>
            <li>We regularly check that partners are following security best practices</li>
            <li>We only share the minimum data needed for our service to work</li>
            <li>We hold partners accountable for protecting your information</li>
          </ul>

          <h2 className="text-xl md:text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FACC15] rounded-full"></div>
            Contact Our Security Team
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            If you have security concerns or want to report a vulnerability:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-3 text-slate-600 font-medium">
            <li>Email: <a href="mailto:contact@lanamind.com" className="text-slate-900 hover:underline font-bold">contact@lanamind.com</a></li>
            <li>Encrypted message: security@lana.ai (PGP key available on request)</li>
            <li>Please include details about your security concern</li>
            <li>We respond to security reports within 48 hours</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- PAGE ---------- */
export default function ClientSecurityPage() {
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
        <SecurityPolicyContent />
      </main>
      <Footer />
    </div>
  )
}