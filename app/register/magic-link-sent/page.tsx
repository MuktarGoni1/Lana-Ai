"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function MagicLinkSentContent() {
  const params = useSearchParams();
  const email = params.get("email") || "your email";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
              <svg
                className="w-7 h-7 text-white/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Check your inbox!</h1>
              <p className="text-white/40 text-sm">We've sent a magic link to</p>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-white/70">
              {email}
            </p>
            
            <p className="text-white/50 text-sm">
              Click the link in the email to continue
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/register/form?role=parent"
              prefetch={false}
              className="w-full px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] 
                       text-white font-medium text-sm
                       hover:bg-white/[0.1] transition-all duration-200
                       flex items-center justify-center gap-3"
            >
              Use a different email
            </Link>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-2 text-white/30">OR</span>
              </div>
            </div>
            
            <Link
              href="/register"
              prefetch={false}
              className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                       hover:bg-white/90 transition-all duration-200"
            >
              Back to options
            </Link>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-xs text-white/30">
              Didn't receive the email? Check your spam folder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MagicLinkSentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
            <p className="text-white/30 text-sm">Loading…</p>
          </div>
        </div>
      }
    >
      <MagicLinkSentContent />
    </Suspense>
  );
}