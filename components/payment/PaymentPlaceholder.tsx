'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentPlaceholderProps {
  title?: string;
  description?: string;
  showCountdown?: boolean;
  onComplete?: () => void;
}

export function PaymentPlaceholder({
  title = "Secure Checkout Coming Soon",
  description = "We're setting up our payment system to provide you with a secure and seamless experience.",
  showCountdown = true,
  onComplete
}: PaymentPlaceholderProps) {
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [showRedirect, setShowRedirect] = useState(false);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showCountdown) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShowRedirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  // Handle redirect completion
  useEffect(() => {
    if (showRedirect && onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [showRedirect, onComplete]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!showRedirect ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="bg-white/[0.03] border-white/[0.06] backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-2xl text-white">{title}</CardTitle>
                <CardDescription className="text-white/60">
                  {description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Loading indicator */}
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-white/70 text-sm">
                    Initializing secure payment environment{dots}
                  </span>
                </div>

                {/* Security badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/60">256-bit SSL</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/60">PCI Compliant</span>
                  </div>
                </div>

                {/* Countdown */}
                {showCountdown && (
                  <div className="text-center">
                    <p className="text-white/50 text-sm">
                      Redirecting in{' '}
                      <span className="text-blue-400 font-mono font-bold">
                        {countdown}
                      </span>{' '}
                      seconds
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5"
                    onClick={() => window.history.back()}
                  >
                    Go Back
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    View Plans
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center gap-4 text-white/40 text-xs">
              <span>🔒 Secure Connection</span>
              <span>•</span>
              <span>✓ Verified</span>
              <span>•</span>
              <span>🛡️ Protected</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl text-white font-semibold mb-2">Redirecting...</h2>
            <p className="text-white/60">Taking you back to pricing</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Default export for page usage
export default function PaymentPlaceholderPage() {
  const handleComplete = () => {
    window.location.href = '/pricing';
  };

  return <PaymentPlaceholder onComplete={handleComplete} />;
}