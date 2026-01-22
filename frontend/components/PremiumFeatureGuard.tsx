import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface PremiumFeatureGuardProps {
  children: React.ReactNode;
  featureName?: string;
  fallback?: React.ReactNode;
  showUpgradeOption?: boolean;
  redirectToUpgrade?: boolean;
  className?: string;
}

const PremiumFeatureGuard: React.FC<PremiumFeatureGuardProps> = ({
  children,
  featureName = 'feature',
  fallback,
  showUpgradeOption = true,
  redirectToUpgrade = false,
  className = ''
}) => {
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();
  const [isPro, setIsPro] = useState<boolean>(false);
  const [checkingPro, setCheckingPro] = useState<boolean>(true);

  useEffect(() => {
    const checkProStatus = async () => {
      if (isLoading || !isAuthenticated) {
        setCheckingPro(false);
        setIsPro(false);
        return;
      }

      try {
        setCheckingPro(true);
        
        // Check subscription status
        const response = await fetch('/api/subscription/status');
        
        if (response.ok) {
          const data = await response.json();
          setIsPro(Boolean(data.is_pro));
        } else {
          // Handle specific error cases
          if (response.status === 404) {
            console.error('Subscription status endpoint not found');
            setIsPro(false);
          } else {
            // Treat any other status as non-pro without noisy logging
            setIsPro(false);
          }
        }
      } catch (e: unknown) {
        console.error('Error checking subscription status:', e);
        setIsPro(false);
      } finally {
        setCheckingPro(false);
      }
    };

    checkProStatus();
  }, [isAuthenticated, isLoading]);

  // Show fallback or locked state if user is not pro
  if (checkingPro) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-white/60">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!isPro) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={`relative ${className}`}>
        {/* Blurred overlay for premium content */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-xl z-10 flex items-center justify-center" />
        
        <div className="relative z-20 p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl"
          >
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-white mb-3">
            Upgrade to Access {featureName}
          </h3>
          
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            Unlock premium features including personalized AI tutors, detailed performance reports, and advanced learning tools.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-white/80">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Personalized AI Tutor with live avatar</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/80">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Monthly Performance Reports</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/80">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Audio Summaries & Class Review Alarms</span>
            </div>
          </div>
          
          {showUpgradeOption && (
            <div className="mt-8">
              <Button
                onClick={() => {
                  if (redirectToUpgrade) {
                    window.location.href = '/pricing';
                  } else {
                    // Scroll to pricing section or show modal
                    const pricingSection = document.querySelector('#pricing') || document.querySelector('[href="/pricing"]');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/pricing';
                    }
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 text-black font-bold rounded-2xl hover:from-yellow-300 hover:via-orange-400 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-xl text-lg flex items-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </div>
        
        {/* Show a subtle preview of the content behind the lock */}
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  // User is pro, show the actual content
  return <>{children}</>;
};

export default PremiumFeatureGuard;