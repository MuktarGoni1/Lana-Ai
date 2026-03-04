"use client";

import Link from "next/link";

export default function SignedOutPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">You’ve signed out</h1>
          <p className="text-white/60 text-sm">
            Thanks for using Lana. You can sign in again anytime.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            prefetch={false}
            className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors text-center"
          >
            Sign in again
          </Link>

          <Link
            href="/landing-page"
            prefetch={false}
            className="w-full px-6 py-3 rounded-xl bg-white/10 text-white/90 font-medium text-sm hover:bg-white/20 transition-colors text-center border border-white/20"
          >
            Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}