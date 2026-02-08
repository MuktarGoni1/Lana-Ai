"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import Link from "next/link";
import { CreditCard, Lock, CheckCircle, ArrowLeft, AlertTriangle, Loader2, Shield, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Payment placeholder component shown when user tries to checkout
function PaymentComingSoon({ onBack }: { onBack: () => void }) {
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-black flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Secure Checkout Coming Soon</h2>
            <p className="text-white/60">
              We're setting up our payment system to provide you with a secure and seamless experience.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-3 py-4 mb-6">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-white/70 text-sm">
              Initializing secure payment environment{dots}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/60">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/60">PCI Compliant</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-white/50 text-sm">
              Redirecting in{' '}
              <span className="text-blue-400 font-mono font-bold">{countdown}</span>{' '}
              seconds
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
            >
              Go Back
            </button>
            <Link
              href="/pricing"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-center transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-white/40 text-xs">
          <span>🔒 Secure Connection</span>
          <span>•</span>
          <span>✓ Verified</span>
          <span>•</span>
          <span>🛡️ Protected</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useUnifiedAuth();
  const [showPaymentPlaceholder, setShowPaymentPlaceholder] = useState(true); // Always show placeholder until Stripe is ready
  const [generalError, setGeneralError] = useState<string | null>(null);

  const planName = searchParams.get("plan");
  const interval = searchParams.get("interval");

  // Validate URL parameters
  useEffect(() => {
    if (!planName || !interval) {
      setGeneralError('Invalid plan selection. Please select a plan from the pricing page.');
      return;
    }
    
    const sanitizedInterval = decodeURIComponent(interval);
    if (sanitizedInterval !== 'monthly' && sanitizedInterval !== 'yearly') {
      setGeneralError('Invalid billing interval selected.');
      return;
    }
    
    const allowedPlans = ['Free', 'Family', 'Family Plus'];
    if (!allowedPlans.includes(decodeURIComponent(planName))) {
      setGeneralError('Invalid plan selected. Please select a valid plan from the pricing page.');
    }
  }, [planName, interval]);

  if (generalError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Error</h2>
          <p className="text-white/60 mb-6">{generalError}</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Verifying your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-white/60 mb-6">
            You need to be signed in to complete your purchase.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show payment placeholder instead of actual checkout
  if (showPaymentPlaceholder) {
    return <PaymentComingSoon onBack={() => router.back()} />;
  }

  // This should never render since we always show the placeholder
  return null;
}