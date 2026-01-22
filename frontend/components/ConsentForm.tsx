'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComprehensiveAuth } from '@/contexts/ComprehensiveAuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, FileText, UserRoundCheck } from 'lucide-react';

interface ConsentOptions {
  privacyPolicyAccepted: boolean;
  termsOfServiceAccepted: boolean;
  marketingCommunication: boolean;
  childDataUsage: boolean;
}

export default function ConsentForm() {
  const { requestUserConsent, hasGivenConsent, getUserRole, user } = useComprehensiveAuth();
  const [consent, setConsent] = useState<ConsentOptions>({
    privacyPolicyAccepted: false,
    termsOfServiceAccepted: false,
    marketingCommunication: false,
    childDataUsage: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user has already given consent
  useEffect(() => {
    if (hasGivenConsent()) {
      // User has already given consent, redirect to appropriate page
      const role = getUserRole();
      if (role === 'child') {
        router.push('/homepage');
      } else {
        router.push('/term-plan?onboarding=1');
      }
    }
  }, [hasGivenConsent, getUserRole, router]);

  const handleCheckboxChange = (field: keyof ConsentOptions) => {
    setConsent(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // All required consents must be accepted
      if (!consent.privacyPolicyAccepted || !consent.termsOfServiceAccepted) {
        setError('You must accept both the Privacy Policy and Terms of Service to continue.');
        setLoading(false);
        return;
      }

      const consentResult = await requestUserConsent({
        privacyPolicyAccepted: consent.privacyPolicyAccepted,
        termsOfServiceAccepted: consent.termsOfServiceAccepted,
        marketingCommunication: consent.marketingCommunication,
        childDataUsage: consent.childDataUsage,
        createdAt: new Date().toISOString()
      });

      if (!consentResult.success) {
        setError(consentResult.error || 'Failed to save consent. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect based on user role
      const role = getUserRole();
      if (role === 'child') {
        router.push('/homepage');
      } else {
        router.push('/term-plan?onboarding=1');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Determine if this is a child user
  const isChildUser = getUserRole() === 'child';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm border-gray-800 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isChildUser ? 'Parental Consent Required' : 'User Consent Required'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isChildUser 
              ? 'Your parent or guardian must review and accept the following terms before proceeding.' 
              : 'Please review and accept the following terms to continue.'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Privacy Policy Consent */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-800 bg-gray-900/30">
                <div className="flex items-center h-5 pt-0.5">
                  <Checkbox
                    id="privacy-policy"
                    checked={consent.privacyPolicyAccepted}
                    onCheckedChange={() => handleCheckboxChange('privacyPolicyAccepted')}
                    className="border-gray-600 data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="ml-3">
                  <Label htmlFor="privacy-policy" className="text-sm font-medium text-white flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                    I have read and agree to the Privacy Policy
                  </Label>
                  <p className="text-xs text-gray-400 mt-1">
                    This explains how we collect, use, and protect your personal information.
                  </p>
                </div>
              </div>
              
              {/* Terms of Service Consent */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-800 bg-gray-900/30">
                <div className="flex items-center h-5 pt-0.5">
                  <Checkbox
                    id="terms-of-service"
                    checked={consent.termsOfServiceAccepted}
                    onCheckedChange={() => handleCheckboxChange('termsOfServiceAccepted')}
                    className="border-gray-600 data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="ml-3">
                  <Label htmlFor="terms-of-service" className="text-sm font-medium text-white flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                    I have read and agree to the Terms of Service
                  </Label>
                  <p className="text-xs text-gray-400 mt-1">
                    This outlines the rules and guidelines for using our service.
                  </p>
                </div>
              </div>
              
              {/* Marketing Communications */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-800 bg-gray-900/30">
                <div className="flex items-center h-5 pt-0.5">
                  <Checkbox
                    id="marketing"
                    checked={consent.marketingCommunication}
                    onCheckedChange={() => handleCheckboxChange('marketingCommunication')}
                    className="border-gray-600 data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="ml-3">
                  <Label htmlFor="marketing" className="text-sm font-medium text-white flex items-center">
                    <UserRoundCheck className="w-4 h-4 mr-2 text-blue-400" />
                    I consent to receive marketing communications
                  </Label>
                  <p className="text-xs text-gray-400 mt-1">
                    Receive updates, promotions, and educational content (optional).
                  </p>
                </div>
              </div>
              
              {/* Child Data Usage - Only for parent/guardian */}
              {!isChildUser && (
                <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-800 bg-gray-900/30">
                  <div className="flex items-center h-5 pt-0.5">
                    <Checkbox
                      id="child-data"
                      checked={consent.childDataUsage}
                      onCheckedChange={() => handleCheckboxChange('childDataUsage')}
                      className="border-gray-600 data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  <div className="ml-3">
                    <Label htmlFor="child-data" className="text-sm font-medium text-white flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-blue-400" />
                      I consent to the collection and use of my child's data
                    </Label>
                    <p className="text-xs text-gray-400 mt-1">
                      Allow us to collect and use educational data to personalize learning experiences (required for child accounts).
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> By continuing, you confirm that you are either the account owner or have legal authority to consent on behalf of the account owner. For child accounts, parental consent is required.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => {
                // For now, just go back - in a real implementation, this might redirect to login
                router.back();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || !consent.privacyPolicyAccepted || !consent.termsOfServiceAccepted}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}