"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function MagicLinkSentContent() {
  const params = useSearchParams();
  const email = params.get("email") || "your email";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white/80"
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
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl font-light tracking-tight">
            Check your inbox
          </h1>
          
          <div className="space-y-1">
            <p className="text-white/50 text-sm">
              We&apos;ve sent a magic link to
            </p>
            <p className="text-white/90 font-light text-lg">
              {email}
            </p>
          </div>

          <p className="text-white/40 text-xs pt-2">
            Click the link in the email to continue
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/register/form?role=parent"
            prefetch={false}
            className="block w-full px-5 py-3.5 rounded-lg bg-white text-black font-medium text-sm hover:bg-white/95 transition-all duration-200 text-center"
          >
            Use a different email
          </Link>

          <Link
            href="/register"
            prefetch={false}
            className="block w-full px-5 py-3.5 rounded-lg text-white/70 font-medium text-sm hover:text-white hover:bg-white/[0.03] transition-all duration-200 text-center"
          >
            Back to options
          </Link>
        </div>

        {/* Helper text */}
        <div className="mt-12 text-center">
          <p className="text-white/30 text-xs">
            Didn&apos;t receive the email? Check your spam folder
          </p>
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