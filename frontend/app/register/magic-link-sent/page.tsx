"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function MagicLinkSentContent() {
  const params = useSearchParams();
  const email = params.get("email") || "your email";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 font-sans antialiased">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-600/10 to-gray-800/10 rounded-2xl flex items-center justify-center border-2 border-gray-600/20">
            <svg
              className="w-10 h-10 text-gray-400"
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

        {/* Content */}
        <div className="space-y-6 mb-10">
          <h1 className="text-3xl font-bold text-white">
            Check your inbox! 📬
          </h1>
          
          <div className="space-y-2">
            <p className="text-white/70 text-lg font-medium">
              We&apos;ve sent a magic link to
            </p>
            <p className="text-xl font-bold text-gray-300 bg-gray-800/30 py-3 px-6 rounded-2xl inline-block border border-gray-700/30">
              {email}
            </p>
          </div>

          <p className="text-white/60 text-base font-medium">
            Click the link in the email to continue
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/register/form?role=parent"
            prefetch={false}
            className="block w-full py-4 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold text-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-xl shadow-gray-500/25 hover:shadow-gray-600/35 hover:-translate-y-1 min-h-14"
          >
            Use a different email
          </Link>

          <Link
            href="/register"
            prefetch={false}
            className="block w-full py-4 rounded-2xl bg-gradient-to-r from-gray-600/20 to-gray-800/20 border-2 border-gray-600/30 text-white font-bold text-lg hover:from-gray-700/30 hover:to-gray-900/30 transition-all duration-300 shadow-xl shadow-gray-500/15 hover:shadow-gray-600/25 hover:-translate-y-1 min-h-14"
          >
            Back to options
          </Link>
        </div>

        {/* Helper text */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs">
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